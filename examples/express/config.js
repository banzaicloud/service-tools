'use strict'

const joi = require('joi')

const envVarsSchema = joi
  .object({
    PORT: joi
      .number()
      .integer()
      .min(0)
      .max(65535)
      .default(3000),
  })
  .unknown()
  .required()

const { value: envVars, error } = joi.validate(process.env, envVarsSchema, {
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
