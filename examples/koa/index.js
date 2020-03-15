'use strict'

const http = require('http')
const { promisify } = require('util')
const { config, catchErrors, logger, middleware, gracefulShutdown } = require('@banzaicloud/service-tools')
const stoppable = require('stoppable')
const Koa = require('koa')
const Router = require('koa-router')
const cfg = require('./config')

// catch all uncaught exceptions and unhandled promise rejections and exit application
catchErrors([closeResources])

// intercept console calls and use built in (pino) logger instead
logger.interceptConsole()

const { nodeEnv } = config.environment
console.log('starting application', { nodeEnv })

// create koa application and router
const app = new Koa()
const router = new Router()

// create routes
router.get('/', (ctx) => {
  ctx.status = 200
})
router.get('/metrics', middleware.koa.prometheusMetrics())
router.get(
  '/health',
  middleware.koa.healthCheck([
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

// register middleware
app.use(middleware.koa.errorHandler())
app.use(middleware.koa.requestLogger())
app.use(router.routes())
app.use(router.allowedMethods())

// use `stoppable` to stop accepting new connections and closes existing,
// idle connections(including keep - alives) without killing requests that are in-flight
// on .stop() call
const server = stoppable(http.createServer(app.callback()))
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
    console.log('close server')
    await closeServer()
  }
  // ... close databases, message queues and other resources
}

// gracefully handle application stop (on SIGTERM & SIGINT)
gracefulShutdown([closeResources])
