import { Request, RequestHandler, Response } from 'express'
import defaultLogger from '../../logger'

export default function healthCheckFactory(
  checks: Array<() => Promise<any>> = [],
  { logger = defaultLogger.error.bind(defaultLogger) } = {}
): RequestHandler {
  // respond with '503 Service Unavailable' once the termination signal is received
  let shuttingDown = false
  process.once('SIGTERM', () => {
    shuttingDown = true
  })

  return async function healthCheck(req: Request, res: Response) {
    if (shuttingDown) {
      res.status(503).send({
        status: 'error',
        details: {
          reason: 'service is shutting down',
        },
      })
      return
    }

    for (const check of checks) {
      try {
        await check()
      } catch (err) {
        logger(err, 'health check failed')
        res.status(500).send({
          status: 'error',
        })
        return
      }
    }

    res.status(200).send({
      status: 'ok',
    })
  }
}
