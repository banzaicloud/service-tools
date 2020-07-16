import * as mockConsole from 'jest-mock-console'
import logger from './'

describe('logger', () => {
  let restoreConsole: RestoreConsole

  beforeAll(() => {
    restoreConsole = mockConsole()
  })

  afterAll(() => {
    restoreConsole()
  })

  afterEach(() => {
    logger.restoreConsole()
  })

  it('should intercept console calls', () => {
    jest.spyOn(logger, 'info')
    console.log('foo')
    expect(logger.info).not.toHaveBeenCalled()
    logger.interceptConsole()
    console.log('foo')
    expect(logger.info).toHaveBeenCalledWith('foo')
  })

  it('should intercept console calls', () => {
    jest.spyOn(logger, 'error')
    console.error('foo')
    expect(logger.error).not.toHaveBeenCalled()
    logger.interceptConsole(['error'])
    console.error('foo')
    expect(logger.error).toHaveBeenCalledWith('foo')
  })
})
