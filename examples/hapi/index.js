'use strict'

const { promisify } = require('util')
const { config, catchErrors, logger, middleware, gracefulShutdown } = require('@banzaicloud/service-tools')
const stoppable = require('stoppable')
const Hapi = require('@hapi/hapi')
const cfg = require('./config')

// catch all uncaught exceptions and unhandled promise rejections and exit application
catchErrors([closeResources])

// intercept console calls and use built in (pino) logger instead
logger.interceptConsole()

const { nodeEnv } = config.environment
console.log('starting application', { nodeEnv })

// create Hapi server application and router
const server = Hapi.server()

// create routes
server.route({
  method: 'GET',
  path: '/',
  handler(req, h) {
    return { status: 'ok' }
  },
})
server.register({
  plugin: middleware.hapi.prometheusMetrics,
  options: {
    path: '/metrics',
  },
})
server.register({
  plugin: middleware.hapi.healthCheck,
  options: {
    path: '/health',
    checks: [
      async () => {
        // fake check
        return new Promise((resolve, reject) => {
          if (Math.random() < 0.2) {
            return reject(new Error('check failed'))
          }

          resolve()
        })
      },
    ],
  },
})

// use `stoppable` to stop accepting new connections and closes existing,
// idle connections(including keep - alives) without killing requests that are in-flight
// on .stop() call
const httpServer = stoppable(server.listener)
// start server
httpServer.listen(cfg.server.port)

httpServer.once('listening', () => {
  const { port } = httpServer.address()
  console.log(`server is listening on port ${port}`)
})

httpServer.once('error', (err) => {
  console.error('server error', err)
  process.exit(1)
})

// close resources on error and stop signal
var closeServer = promisify(httpServer.stop).bind(httpServer)
async function closeResources() {
  // handle ongoing requests and close server
  if (closeServer) {
    await closeServer()
  }
  // ... close databases, message queues and other resources
}

// gracefully handle application stop (on SIGTERM & SIGINT)
gracefulShutdown([closeResources])
