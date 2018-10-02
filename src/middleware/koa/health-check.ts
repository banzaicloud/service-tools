import { Context } from 'koa'
import defaultLogger from '../../logger'

export default function healthCheckFactory(
  checks: Array<() => Promise<any>> = [],
  { logger = defaultLogger.error.bind(defaultLogger), serviceUnavailableOnTermination = true } = {}
) {
  let shuttingDown = false
  if (serviceUnavailableOnTermination) {
    // respond with '503 Service Unavailable' once the termination signal is received
    process.once('SIGTERM', () => {
      shuttingDown = true
    })
  }

  return async function healthCheck(ctx: Context) {
    if (shuttingDown) {
      ctx.status = 503
      ctx.body = {
        status: 'error',
        details: {
          reason: 'service is shutting down',
        },
      }
      return
    }

    for (const check of checks) {
      try {
        await check()
      } catch (err) {
        logger(err, 'health check failed')
        ctx.status = 500
        ctx.body = {
          status: 'error',
        }
        return
      }
    }

    ctx.status = 200
    ctx.body = { status: 'ok' }
  }
}
