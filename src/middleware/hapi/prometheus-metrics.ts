import * as Hapi from '@hapi/hapi'
import * as promClient from 'prom-client'
import * as pgk from '../../../package.json'

interface IOptions {
  path: string
  client?: typeof promClient
  collectDefaultMetrics?: boolean
  timeout?: number
  defaultLabels?: object
}

const prometheusMetrics: Hapi.Plugin<IOptions> = {
  name: `${pgk.name}/prometheus-metrics`,
  version: pgk.version,
  async register(
    server: Hapi.Server,
    { path, client = promClient, collectDefaultMetrics = true, defaultLabels = {} }: IOptions
  ) {
    if (typeof path !== 'string') {
      throw new TypeError('path in options is required')
    }

    if (collectDefaultMetrics) {
      client.collectDefaultMetrics()
    }

    if (Object.keys(defaultLabels).length) {
      client.register.setDefaultLabels(defaultLabels)
    }

    server.route({
      method: 'GET',
      path,
      handler(req, h) {
        const metrics = client.register.metrics()
        return h.response(metrics).header('Content-Type', client.register.contentType)
      },
    })
  },
}

export default prometheusMetrics
