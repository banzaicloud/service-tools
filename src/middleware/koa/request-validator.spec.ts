import * as http from 'http'
import * as joi from '@hapi/joi'
import * as Koa from 'koa'
import makeRequest from '../../helper/make-request'
import { requestValidator } from './'

describe('koa request validator middleware', () => {
  let app: Koa
  beforeEach(() => {
    app = new Koa()
  })

  it('should respond with 400 when validation fails', async () => {
    app.use(requestValidator({ query: joi.object({ foo: joi.string().required() }).required() }))
    app.use((ctx: Koa.Context) => {
      ctx.status = 200
    })

    const server = http.createServer(app.callback())
    const response = await makeRequest(server, { endpoint: '/?bar=foo' })
    expect(response.statusCode).toEqual(400)
  })

  it('should continue when validation passes', async () => {
    app.use(requestValidator({ query: joi.object({ foo: joi.string().required() }).required() }))
    app.use((ctx: Koa.Context) => {
      const { validated = {} } = ctx.state || {}
      ctx.status = 200
      ctx.body = validated
    })

    const server = http.createServer(app.callback())
    const response = await makeRequest(server, { endpoint: '/?foo=bar' })
    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual({ query: { foo: 'bar' } })
  })
})
