import catchErrors from './catch-errors'
import logger from './logger'

describe('catch errors', () => {
  let reset: () => void
  let closeHandler: jest.Mock<{}>

  beforeEach(() => {
    closeHandler = jest.fn().mockResolvedValue(undefined)
    jest.spyOn(logger, 'fatal').mockReturnValue(undefined)
    jest.spyOn(process, 'exit').mockImplementation(() => {
      /* noop */
    })
    reset = catchErrors([closeHandler])
  })

  afterEach(() => {
    reset()
    jest.restoreAllMocks()
  })

  it('should catch uncaught exceptions and exit the process', async () => {
    const err = new Error()
    process.emit('uncaughtException', err)
    // wait for promises
    await new Promise((resolve) => setImmediate(resolve))
    expect(logger.fatal).toHaveBeenCalledWith(err, 'uncaught exception')
    expect(closeHandler).toHaveBeenCalled()
    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('should catch unhandled promise rejections', async () => {
    jest.spyOn(logger, 'fatal').mockReturnValue(undefined)
    jest.spyOn(process, 'exit').mockImplementation(() => {
      /* noop */
    })
    const reason = new Error()
    const promise = new Promise(() => {
      /* don't care */
    })
    process.emit('unhandledRejection', reason, promise)
    // wait for promises
    await new Promise((resolve) => setImmediate(resolve))
    expect(logger.fatal).toHaveBeenCalledWith(reason, 'unhandled promise rejection')
    expect(closeHandler).toHaveBeenCalled()
    expect(process.exit).toHaveBeenCalledWith(1)
  })
})
