import * as joi from '@hapi/joi'
import { LoggerOptions } from 'pino'

const schema = joi
  .object({
    LOGGER_LEVEL: joi
      .string()
      .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
      .when('NODE_ENV', {
        switch: [
          {
            is: 'test',
            then: joi.string().default('fatal'),
          },
          {
            is: 'development',
            then: joi.string().default('debug'),
            otherwise: joi.string().default('info'),
          },
        ],
      }),
    LOGGER_REDACT_FIELDS: joi
      .string()
      .default('password, pass, authorization, auth, cookie, _object')
      .description('Comma separated list of field names to remove from objects'),
    NODE_ENV: joi.string().default('production'),
  })
  .unknown()
  .required()

export default function getConfig() {
  const { value: envVars, error } = schema.validate(process.env, { abortEarly: false })
  if (error) {
    // don't expose environment variables in stack traces / logs
    delete error._object
    throw error
  }

  const redactFields = envVars
    .LOGGER_REDACT_FIELDS!.split(',')
    .map((field: string) => field.trim())
    .filter((field: string) => field !== '')

  const config: LoggerOptions = {
    level: envVars.LOGGER_LEVEL,
    redact: redactFields,
  }

  return config
}
