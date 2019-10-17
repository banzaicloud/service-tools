'use strict'

const http = require('http')
const { promisify } = require('util')
const { config, catchErrors, logger, middleware, gracefulShutdown } = require('@banzaicloud/service-tools')
const stoppable = require('stoppable')
const express = require('express')
const cfg = require('./config')

// catch all uncaught exceptions and unhandled promise rejections and exit application
catchErrors([closeResources])

// intercept console calls and use built in (pino) logger instead
logger.interceptConsole()

const { nodeEnv } = config.environment
console.log('starting application', { nodeEnv })

// create an express application
const app = express()

// create routes
app.get('/', (req, res) => {
  res.status(200).end()
})
app.get('/metrics', middleware.express.prometheusMetrics())
app.get(
  '/health',
  middleware.express.healthCheck([
    async () => {
      // fake check
      return new Promise((resolve, reject) => {
        if (Math.random() < 0.2) {
          return reject(new Error('check failed'))
        }

        resolve()
      })
    },
  ])
)

// register error middleware
app.use(middleware.express.errorHandler())

// use `stoppable` to stop accepting new connections and closes existing,
// idle connections(including keep - alives) without killing requests that are in-flight
// on .stop() call
const server = stoppable(http.createServer(app))
// start server
server.listen(cfg.server.port)

server.once('listening', () => {
  const { port } = server.address()
  console.log(`server is listening on port ${port}`)
})

server.once('error', (err) => {
  console.error('server error', err)
  process.exit(1)
})

// close resources on error and stop signal
var closeServer = promisify(server.stop).bind(server)
async function closeResources() {
  // handle ongoing requests and close server
  if (closeServer) {
    await closeServer()
  }
  // ... close databases, message queues and other resources
}

// gracefully handle application stop (on SIGTERM & SIGINT)
gracefulShutdown([closeResources])
