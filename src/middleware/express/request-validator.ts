import * as joi from '@hapi/joi'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import { BadRequest } from 'http-errors'

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
    const { value: validated, error } = schema.validate(
      {
        params: req.params,
        query: req.query,
        body: req.body,
      },
      { abortEarly: false }
    )
    if (error) {
      const err = Object.assign(new BadRequest('validation error'), { details: error.details })
      return next(err)
    }

    Object.assign(req, validated)
    next()
  }
}
