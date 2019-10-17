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

  return {
    nodeEnv: envVars.NODE_ENV as string,
  }
}
