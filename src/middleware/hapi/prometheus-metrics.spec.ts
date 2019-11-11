import * as Hapi from '@hapi/hapi'
import * as http from 'http'
import makeRequest from '../../helper/make-request'
import { prometheusMetrics } from './'

describe('hapi prometheus metrics plugin', () => {
  let server: Hapi.Server
  beforeEach(() => {
    server = Hapi.server()
  })

  it('should serve metrics with default client', async () => {
    server.register({ plugin: prometheusMetrics, options: { path: '/metrics' } })
    const response = await makeRequest(server.listener, { endpoint: '/metrics' })
    expect(response.statusCode).toEqual(200)
    expect(response.headers['content-type']).toEqual('text/plain; version=0.0.4; charset=utf-8')
  })

  it('should serve metrics with provided client', async () => {
    const client = {
      register: {
        contentType: 'text/plain; version=0.0.4; charset=utf-8',
        metrics: jest.fn().mockReturnValue('METRICS'),
      },
    }
    server.register({
      plugin: prometheusMetrics,
      options: {
        client,
        path: '/metrics',
        collectDefaultMetrics: false,
      },
    })
    const response = await makeRequest(server.listener, { endpoint: '/metrics' })
    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual('METRICS')
    expect(client.register.metrics).toHaveBeenCalled()
  })
})
