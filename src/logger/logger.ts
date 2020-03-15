import * as pino from 'pino'
import config from '../config'

const logger = pino(config.pino)

let originals: INameToValueMap
export default Object.assign(logger, {
  interceptConsole(levels = ['log', 'debug', 'info', 'warn', 'error']) {
    const useLogger = (level: string) => {
      const log = (logger[level] ? logger[level] : logger.info).bind(logger)
      return (...args: Array<any>) => {
        if (args.length > 0) {
          if (typeof args[0] === 'string' && typeof args[1] === 'object') {
            log(args[1], args[0], ...args.slice(2))
          } else {
            log(args[0], ...args.slice(1))
          }
        } else {
          log(args[0])
        }
      }
    }

    originals = {}
    for (const level of levels) {
      originals[level] = (console as INameToValueMap)[level]
      Object.assign(console, {
        [level]: useLogger(level),
      })
    }
  },

  restoreConsole() {
    for (const level of Object.keys(originals)) {
      Object.assign(console, {
        [level]: originals[level],
      })
    }
  },
})

interface INameToValueMap {
  [key: string]: any
}
