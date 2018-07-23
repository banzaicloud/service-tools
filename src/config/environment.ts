/**
 * Exports the runtime environment and as a side-effect, it loads .env in development
 * Uses the `NODE_ENV` environment variable
 */

import * as joi from 'joi'

const envVarsSchema = joi
  .object({
    // runtime environment. Valid values are: production, development, test
    NODE_ENV: joi
      .string()
      .valid(['production', 'development', 'test'])
      .default('production'),
  })
  .unknown()
  .required()

export default function getConfig() {
  const { value: envVars, error } = joi.validate(process.env, envVarsSchema, { abortEarly: false })
  if (error) {
    // don't expose environment variables in stack traces / logs
    delete error._object
    throw error
  }

  if (envVars.NODE_ENV === 'development') {
    // load .env in local development only
    try {
      // it can throw error as dotenv is an optional dependency only
      // tslint:disable-next-line:no-var-requires
      const dotenv = require('dotenv')
      dotenv.config({ silent: true })
    } catch (err) {
      // ignore
    }
  }

  return {
    nodeEnv: envVars.NODE_ENV as string,
  }
}
