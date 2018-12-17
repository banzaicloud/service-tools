import * as express from 'express'
import * as http from 'http'
import makeRequest from '../../helper/make-request'
import { healthCheck } from './'

describe('express health check middleware', () => {
  const logger: any = jest.fn((...args: any[]) => undefined)

  let app: express.Application
  beforeEach(() => {
    app = express()
  })

  it('should respond with 200 status `ok` when all checks are passing', async () => {
    app.get('/', healthCheck([() => Promise.resolve()], { logger }))

    const server = http.createServer(app)
    const response = await makeRequest(server)
    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual({ status: 'ok' })
    expect(logger).not.toHaveBeenCalled()
  })

  it('should respond with 500 status `error` when some checks are failing', async () => {
    const err = new Error('dependency error')
    app.get('/', healthCheck([() => Promise.resolve(), () => Promise.reject(err)], { logger }))

    const server = http.createServer(app)
    const response = await makeRequest(server)
    expect(response.statusCode).toEqual(500)
    expect(response.body).toEqual({ status: 'error' })
    expect(logger).toHaveBeenCalledWith(err, 'health check failed')
  })

  it('should respond with 503 status `error` when shutdown signal is received', async () => {
    app.get('/', healthCheck([() => Promise.resolve()], { logger }))

    const server = http.createServer(app)
    let response = await makeRequest(server)
    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual({ status: 'ok' })
    expect(logger).not.toHaveBeenCalled()

    process.emit('SIGTERM', 'SIGTERM')

    response = await makeRequest(server)
    expect(response.statusCode).toEqual(503)
    expect(response.body).toEqual({ status: 'error', details: { reason: 'service is shutting down' } })
    expect(logger).not.toHaveBeenCalled()
  })
})
