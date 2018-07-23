import * as http from 'http'
import * as createError from 'http-errors'
import * as Koa from 'koa'
import makeRequest from '../../helper/make-request'
import { errorHandler } from './'

describe('koa error handler middleware', () => {
  const logger: any = jest.fn((...args: any[]) => undefined)

  let app: Koa
  beforeEach(() => {
    app = new Koa()
    app.use(errorHandler({ logger }))
  })

  it('should use the proper status code and body of a HttpError (status: 4xx)', async () => {
    app.use((ctx) => {
      throw new createError.Forbidden()
    })

    const server = http.createServer(app.callback())
    const response = await makeRequest(server)
    expect(response.statusCode).toEqual(403)
    expect(response.body).toEqual({ message: 'Forbidden' })
    expect(logger).not.toHaveBeenCalled()
  })

  it('should use the proper status code and body of a HttpError (status: 5xx)', async () => {
    app.use((ctx) => {
      throw new Error('Error message')
    })

    const server = http.createServer(app.callback())
    const response = await makeRequest(server)
    expect(response.statusCode).toEqual(500)
    expect(response.body).toEqual({ message: 'Internal Server Error' })
    expect(logger).toHaveBeenCalled()
  })
})
