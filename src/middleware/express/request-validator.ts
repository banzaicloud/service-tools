import { NextFunction, Request, RequestHandler, Response } from 'express'
import { BadRequest } from 'http-errors'
import * as joi from 'joi'

/**
 * Express request validator middleware
 * returns with 400 if the request is not valid
 */
export default function requestValidatorFactory({
  params = joi.any(),
  query = joi.any(),
  body = joi.any(),
} = {}): RequestHandler {
  const schema = joi
    .object({
      params,
      query,
      body,
    })
    .required()

  return function requestValidator(req: Request, res: Response, next: NextFunction) {
    const toValidate = {
      params: req.params,
      query: req.query,
      body: req.body,
    }

    const { value: validated, error } = joi.validate(toValidate, schema, { abortEarly: false })
    if (error) {
      const err = Object.assign(new BadRequest('validation error'), { details: error.details })
      return next(err)
    }

    Object.assign(req, validated)
    next()
  }
}
