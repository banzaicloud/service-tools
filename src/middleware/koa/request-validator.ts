import { BadRequest } from 'http-errors'
import * as joi from 'joi'
import { Context, Request } from 'koa'

interface IContextWithRequest extends Context {
  params?: object
  request: Request & {
    params?: object
    body?: object
    query?: object
  }
}

export default function requestValidatorFactory({ params = joi.any(), query = joi.any(), body = joi.any() } = {}) {
  const schema = joi
    .object({
      params,
      query,
      body,
    })
    .required()

  return async function requestValidator(ctx: IContextWithRequest, next: () => void) {
    const toValidate = {
      params: ctx.params || (ctx.request && ctx.request.params),
      query: ctx.query || (ctx.request && ctx.request.query),
      body: ctx.request && ctx.request.body,
    }

    const { value: validated, error } = joi.validate(toValidate, schema, { abortEarly: false })
    if (error) {
      throw Object.assign(new BadRequest('validation error'), { details: error.details })
    }

    ctx.state = Object.assign({}, ctx.state, { validated })
    await next()
  }
}
