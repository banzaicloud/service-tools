'use strict'

const joi = require('@hapi/joi')

const schema = joi
  .object({
    PORT: joi.number().integer().min(0).max(65535).default(3000),
  })
  .unknown()
  .required()

const { value: envVars, error } = schema.validate(process.env, {
  abortEarly: false,
})
if (error) {
  // don't expose environment variables
  delete error._object
  throw error
}

const config = {
  server: {
    port: envVars.PORT,
  },
}

module.exports = config
