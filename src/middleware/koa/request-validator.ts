import { BadRequest } from 'http-errors'
import * as joi from 'joi'
import { Context } from 'koa'

/**
 * Koa request validator middleware
 * returns with 400 if the request is not valid
 */
export default function requestValidatorFactory({ params = joi.any(), query = joi.any(), body = joi.any() } = {}) {
  const schema = joi
    .object({
      params,
      query,
      body,
    })
    .required()

  return async function requestValidator(
    ctx: Context & { params?: object; request: { params?: object; body?: object } },
    next: () => void
  ) {
    const toValidate = {
      params: ctx.params || ctx.request.params,
      query: ctx.query || ctx.request.query,
      body: ctx.request.body,
    }

    const { value: validated, error } = joi.validate(toValidate, schema, { abortEarly: false })
    if (error) {
      throw Object.assign(new BadRequest('validation error'), { details: error.details })
    }

    ctx.state = Object.assign({}, ctx.state, { validated })
    await next()
  }
}
