import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import * as createError from 'http-errors'
import defaultLogger from '../../logger'

export default function errorHandlerFactory({
  logger = defaultLogger.error.bind(defaultLogger),
} = {}): ErrorRequestHandler {
  return function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    const httpErr = createError(err)

    if (httpErr.statusCode >= 500 && logger) {
      logger(httpErr)
    }

    const body = httpErr.statusCode < 500 || httpErr.expose ? httpErr : createError(httpErr.status)
    if (httpErr.headers) {
      res.set(httpErr.headers)
    }
    res.status(httpErr.statusCode).send(body)
  }
}
