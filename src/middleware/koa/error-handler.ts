import * as createError from 'http-errors'
import { Context } from 'koa'
import defaultLogger from '../../logger'

export default function errorHandlerFactory({ logger = defaultLogger.error.bind(defaultLogger) } = {}) {
  return async function errorHandler(ctx: Context, next: () => void) {
    try {
      await next()
    } catch (err) {
      err = createError(err)

      if (err.statusCode >= 500 && logger) {
        logger(err)
      }

      ctx.status = err.statusCode
      if (err.headers) {
        for (const name of Object.keys(err.headers)) {
          ctx.set(name, err.headers[name])
        }
      }
      ctx.body = err.statusCode < 500 || err.expose ? err : createError(err.status)
    }
  }
}
