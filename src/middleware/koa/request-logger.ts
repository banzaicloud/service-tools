import { Context, Request } from 'koa'
import * as fp from 'lodash/fp'
import { Stream } from 'stream'

export default function requestLoggerFactory(
  { logger }: { logger: (...args: any[]) => void } = { logger: console.debug }
) {
  return async function requestLogger(ctx: Context, next: () => void) {
    const start = Date.now()

    const {
      method,
      originalUrl,
      headers: requestHeaders,
      body: requestBody,
      ip: remoteIp,
    }: Request & { body?: any } = ctx.request
    const httpRequest = fp.omitBy(fp.isNil, {
      method,
      remoteIp,
      url: originalUrl,
      referrer: ctx.request.get('referer'),
      userAgent: ctx.request.get('user-agent'),
      headers: requestHeaders,
      body: requestBody,
    })

    await next()

    const ms = Date.now() - start
    const { status, headers: responseHeaders, body: responseBody = '' } = ctx.response
    const httpResponse = fp.omitBy(fp.isNil, {
      status,
      headers: responseHeaders,
      body: responseBody instanceof Stream ? '[Stream]' : responseBody,
    })

    logger(`${method}: ${originalUrl}`, {
      httpRequest,
      httpResponse,
      duration: `${ms}ms`,
    })
  }
}
