import { LoggerOptions } from 'pino'
import getEnvironmentConfig from './environment'
import getPinoConfig from './pino'

let environmentConfig: {
  nodeEnv: string
}
let pinoConfig: LoggerOptions

const config = {
  get environment() {
    if (!environmentConfig) {
      environmentConfig = getEnvironmentConfig()
    }

    return environmentConfig
  },

  get pino() {
    if (!pinoConfig) {
      pinoConfig = getPinoConfig()
    }

    return pinoConfig
  },
}
export default config
