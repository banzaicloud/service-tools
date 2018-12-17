import * as express from 'express'
import * as http from 'http'
import * as createError from 'http-errors'
import makeRequest from '../../helper/make-request'
import { errorHandler } from './'

describe('express error handler middleware', () => {
  const logger: any = jest.fn((...args: any[]) => undefined)

  let app: express.Application
  beforeEach(() => {
    app = express()
  })

  it('should use the proper status code and body of a HttpError (status: 4xx)', async () => {
    app.get('/', () => {
      throw new createError.Forbidden()
    })
    app.use(errorHandler({ logger }))

    const server = http.createServer(app)
    const response = await makeRequest(server)
    expect(response.statusCode).toEqual(403)
    expect(response.body).toEqual({ message: 'Forbidden' })
    expect(logger).not.toHaveBeenCalled()
  })

  it('should use the proper status code and body of a HttpError (status: 5xx)', async () => {
    app.get('/', () => {
      throw new Error('Error message')
    })
    app.use(errorHandler({ logger }))

    const server = http.createServer(app)
    const response = await makeRequest(server)
    expect(response.statusCode).toEqual(500)
    expect(response.body).toEqual({ message: 'Internal Server Error' })
    expect(logger).toHaveBeenCalled()
  })
})
