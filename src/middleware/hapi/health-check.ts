import * as Boom from '@hapi/boom'
import * as Hapi from '@hapi/hapi'
import { LogFn } from 'pino'
import * as pgk from '../../../package.json'
import defaultLogger from '../../logger'

interface IOptions {
  path: string
  logger?: LogFn
  checks?: Array<() => Promise<any>>
}

const healthCheck: Hapi.Plugin<IOptions> = {
  name: `${pgk.name}/health-check`,
  version: pgk.version,
  async register(
    server: Hapi.Server,
    { path, logger = defaultLogger.error.bind(defaultLogger), checks = [] }: IOptions
  ) {
    if (typeof path !== 'string') {
      throw new TypeError('path in options is required')
    }

    // respond with '503 Service Unavailable' once the termination signal is received
    let shuttingDown = false
    process.once('SIGTERM', () => {
      shuttingDown = true
    })

    server.route({
      method: 'GET',
      path,
      async handler(req, h) {
        if (shuttingDown) {
          return Boom.serverUnavailable('service is shutting down')
        }

        for (const check of checks) {
          try {
            await check()
          } catch (err) {
            logger(err, 'health check failed')
            return Boom.internal('health check failed')
          }
        }

        return { status: 'ok' }
      },
    })
  },
}

export default healthCheck
