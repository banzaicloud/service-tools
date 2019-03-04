import { LogFn } from 'pino'
import defaultLogger from './logger'

export default function catchErrors(
  closeHandlers: Array<() => Promise<any>> = [],
  {
    exitOnUncaughtPromiseException = true,
    logger = defaultLogger.fatal.bind(defaultLogger) as LogFn,
    timeout = 30,
  }: {
    exitOnUncaughtPromiseException?: boolean
    logger?: LogFn
    timeout?: number
  } = {}
) {
  // it is not safe to resume normal operation after 'uncaughtException'.
  // read more: https://nodejs.org/api/process.html#process_event_uncaughtexception
  const uncaughtExceptionHandler = async (err: Error) => {
    logger(err, 'uncaught exception')

    // shut down anyway after `timeout` seconds
    if (timeout) {
      setTimeout(() => {
        logger('could not finish in time, forcefully exiting')
        process.exit(1)
      }, timeout * 1000).unref()
    }

    for (const handler of closeHandlers) {
      try {
        await Promise.resolve(handler())
      } catch (err) {
        logger(err, 'failed to close resource')
      }
    }

    process.exit(1)
  }
  process.on('uncaughtException', uncaughtExceptionHandler)

  // a Promise is rejected and no error handler is attached.
  // read more: https://nodejs.org/api/process.html#process_event_unhandledrejection
  const unhandledRejectionHandler = async (reason: any = {}, promise: Promise<any>) => {
    logger(reason, 'unhandled promise rejection')

    // shut down anyway after `timeout` seconds
    if (timeout) {
      setTimeout(() => {
        logger('could not finish in time, forcefully exiting')
        process.exit(1)
      }, timeout * 1000).unref()
    }

    for (const handler of closeHandlers) {
      try {
        await Promise.resolve(handler())
      } catch (err) {
        logger(err, 'failed to close resource')
      }
    }

    if (exitOnUncaughtPromiseException) {
      process.exit(1)
    }
  }
  process.on('unhandledRejection', unhandledRejectionHandler)

  return () => {
    process.off('uncaughtException', uncaughtExceptionHandler)
    process.off('unhandledRejection', unhandledRejectionHandler)
  }
}
