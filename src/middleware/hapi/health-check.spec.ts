import * as Hapi from '@hapi/hapi'
import * as http from 'http'
import makeRequest from '../../helper/make-request'
import { healthCheck } from './'

describe('hapi health check plugin', () => {
  const logger: any = jest.fn((...args: any[]) => undefined)

  let server: Hapi.Server
  beforeEach(() => {
    server = Hapi.server()
  })

  it('should respond with 200 status `ok` when all checks are passing', async () => {
    server.register({
      plugin: healthCheck,
      options: {
        path: '/',
        logger,
        checks: [() => Promise.resolve()],
      },
    })

    const response = await makeRequest(server.listener)
    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual({ status: 'ok' })
    expect(logger).not.toHaveBeenCalled()
  })

  it('should respond with 500 status `error` when some checks are failing', async () => {
    server.register({
      plugin: healthCheck,
      options: {
        path: '/',
        logger,
        checks: [() => Promise.resolve(), () => Promise.reject(err)],
      },
    })

    const err = new Error('dependency error')
    const response = await makeRequest(server.listener)
    expect(response.statusCode).toEqual(500)
    expect(response.body).toEqual({
      error: 'Internal Server Error',
      message: 'An internal server error occurred',
      statusCode: 500,
    })
    expect(logger).toHaveBeenCalledWith(err, 'health check failed')
  })

  it('should respond with 503 status `error` when shutdown signal is received', async () => {
    server.register({
      plugin: healthCheck,
      options: {
        path: '/',
        logger,
      },
    })

    let response = await makeRequest(server.listener)
    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual({ status: 'ok' })
    expect(logger).not.toHaveBeenCalled()

    process.emit('SIGTERM', 'SIGTERM')

    response = await makeRequest(server.listener)
    expect(response.statusCode).toEqual(503)
    expect(response.body).toEqual({
      error: 'Service Unavailable',
      message: 'service is shutting down',
      statusCode: 503,
    })
    expect(logger).not.toHaveBeenCalled()
  })
})
