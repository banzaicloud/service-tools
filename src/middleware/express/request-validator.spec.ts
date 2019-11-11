import * as joi from '@hapi/joi'
import * as express from 'express'
import * as http from 'http'
import makeRequest from '../../helper/make-request'
import { requestValidator } from './'

describe('express request validator middleware', () => {
  let app: express.Application
  beforeEach(() => {
    app = express()
  })

  it('should respond with 400 when validation fails', async () => {
    app.get('/', requestValidator({ query: joi.object({ foo: joi.string().required() }).required() }), (req, res) => {
      res.status(200).end()
    })

    const server = http.createServer(app)
    const response = await makeRequest(server, { endpoint: '/?bar=foo' })
    expect(response.statusCode).toEqual(400)
  })

  it('should continue when validation passes', async () => {
    app.get('/', requestValidator({ query: joi.object({ foo: joi.string().required() }).required() }), (req, res) => {
      res.status(200).send({ query: req.query })
    })

    const server = http.createServer(app)
    const response = await makeRequest(server, { endpoint: '/?foo=bar' })
    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual({ query: { foo: 'bar' } })
  })
})
