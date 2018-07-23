import defaultLogger from './logger'

export default function catchErrors({
  exitOnUncaughtPromiseException = true,
  logger = defaultLogger.fatal.bind(defaultLogger),
  closeResources = () => Promise.resolve(),
} = {}) {
  // it is not safe to resume normal operation after 'uncaughtException'.
  // read more: https://nodejs.org/api/process.html#process_event_uncaughtexception
  const uncaughtExceptionHandler = async (err: Error) => {
    logger(err, 'uncaught exception')
    try {
      await closeResources()
    } catch (err) {
      logger(err, 'failed to close resources')
    }
    process.exit(1)
  }
  process.on('uncaughtException', uncaughtExceptionHandler)

  // a Promise is rejected and no error handler is attached.
  // read more: https://nodejs.org/api/process.html#process_event_unhandledrejection
  const unhandledRejectionHandler = async (reason: PromiseRejectionEvent) => {
    logger(reason, 'unhandled promise rejection')
    try {
      await closeResources()
    } catch (err) {
      logger(err, 'failed to close resources')
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
