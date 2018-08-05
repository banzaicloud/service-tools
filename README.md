# Node.js Service Tools <br> [![CircleCI](https://circleci.com/gh/banzaicloud/node-service-tools.svg?style=svg&circle-token=002bb942365281c0834e18a1cb83e1930c3ce0fa)](https://circleci.com/gh/banzaicloud/node-service-tools) [![npm version](https://badge.fury.io/js/%40banzaicloud%2Fservice-tools.svg)](https://badge.fury.io/js/%40banzaicloud%2Fservice-tools)

Prepare your Node.js application for production!

This library provides common functionalities, like graceful error handling & shutdown, structured JSON logging and several HTTP middleware to make your application truly ready for modern containerised environments, like [Kubernetes](http://kubernetes.io/).

<!-- TOC -->

- [Installation](#installation)
- [Usage](#usage)
  - [Main exports](#main-exports)
    - [`logger`](#logger)
      - [Use provided logger instead of `console`](#use-provided-logger-instead-of-console)
    - [`gracefulShutdown(handlers, options)`](#gracefulshutdownhandlers-options)
    - [`catchErrors(options)`](#catcherrorsoptions)
  - [Config](#config)
    - [`config.environment`](#configenvironment)
    - [`config.pino`](#configpino)
  - [Middleware (Koa)](#middleware-koa)
    - [`errorHandler(options)`](#errorhandleroptions)
    - [`healthCheck(checks, options)`](#healthcheckchecks-options)
    - [`prometheusMetrics(options)`](#prometheusmetricsoptions)
    - [`requestValidator(options)`](#requestvalidatoroptions)

<!-- /TOC -->

## Installation

```sh
npm i @banzaicloud/service-tools
```

## Usage

This library is written in TypeScript, refer to the published types or the source code for argument and return types.

### Main exports

#### `logger`

A [pino](https://github.com/pinojs/pino) JSON logger instance configured with [`config.pino`](#config).

```js
const { logger } = require('@banzaicloud/service-tools')

logger.info({ metadata: true }, 'log message')
// > {"level":30,"time":<ts>,"msg":"log message","pid":0,"hostname":"local","metadata":true,"v":1}
```

##### Use provided logger instead of `console`

Globally overwrite the `console` and use the logger provided by the library to print out messages.

```js
const { logger } = require('@banzaicloud/service-tools')

console.log('log message')
// > log message

logger.interceptConsole()

console.log('log message')
// > {"level":30,"time":<ts>,"msg":"log message","pid":0,"hostname":"local","v":1}
```

#### `gracefulShutdown(handlers, options)`

Graceful shutdown: release resources (databases, HTTP connections, ...) before exiting. When the application receives `SIGTERM` or `SIGINT` signals, the close handlers will be called. The handlers should return a `Promise`.

```js
const { gracefulShutdown } = require('@banzaicloud/service-tools')

// ...

// the handlers return a Promise
// the handlers are called in order
gracefulShutdown([closeServer, closeDB])
```

#### `catchErrors(options)`

Catch uncaught exceptions and unhandled Promise rejections. It is not safe to resume normal operation after ['uncaughtException'](https://nodejs.org/api/process.html#process_event_uncaughtexception).

```js
const { catchErrors } = require('@banzaicloud/service-tools')

// ...

// the handlers return a Promise
// the handlers are called in order
catchErrors([closeServer, closeDB])

// the error will be catched and the handlers will be called before exiting
throw new Error()
```

### Config

Load configurations dynamically.

#### `config.environment`

Dynamically load the environment config. It will become available on the `.environment` field. It exports the runtime environment and as a side-effect, it loads `.env` in development. Uses the `NODE_ENV` environment variable, with accepted values of: production, development, test.

```js
const { config } = require('@banzaicloud/service-tools')
// validates NODE_ENV environment variables when referenced first and load .env when it's "development"
console.log(config.environment)
// > { nodeEnv: 'production' }
```

#### `config.pino`

Used by the provided [logger](#logger). Uses the `LOGGER_LEVEL` and `LOGGER_REDACT_FIELDS` environment variables. The `LOGGER_LEVEL` can be one of the following: fatal, error, warn, info, debug, trace. `LOGGER_REDACT_FIELDS` is a comma separated list of field names to mask out in the output (defaults to: `'password, pass, authorization, auth, cookie, _object'`).

```js
const pino = require('pino')
const { config } = require('@banzaicloud/service-tools')

const logger = pino(config.pino)

logger.info({ metadata: true, password: 'secret' }, 'log message')
// > {"level":30,"time":<ts>,"msg":"log message","pid":0,"hostname":"local","metadata":true,"password":"[REDACTED]","v":1}
```

### Middleware (Koa)

Several middleware for the [Koa](https://koajs.com/) web framework.

#### `errorHandler(options)`

Koa error handler middleware.

```js
const Koa = require('koa')
const { koa: middleware } = require('@banzaicloud/service-tools').middleware

const app = new Koa()

// this should be the first middleware
app.use(middleware.errorHandler())
```

#### `healthCheck(checks, options)`

Koa health check endpoint handler.

```js
const Koa = require('koa')
const Router = require('koa-router')
const { koa: middleware } = require('@banzaicloud/service-tools').middleware

// ...

const app = new Koa()
const router = new Router()

// the checks return a Promise
router.get('/health', middleware.healthCheck([checkDB]))

app.use(router.routes())
app.use(router.allowedMethods())
```

#### `prometheusMetrics(options)`

Koa Prometheus metrics endpoint handler. By default it collects some [default metrics](https://github.com/siimon/prom-client#default-metrics).

```js
const Koa = require('koa')
const Router = require('koa-router')
const { koa: middleware } = require('@banzaicloud/service-tools').middleware

// ...

const app = new Koa()
const router = new Router()

router.get('/metrics', middleware.koa.prometheusMetrics())

app.use(router.routes())
app.use(router.allowedMethods())
```

#### `requestValidator(options)`

Koa request validator middleware. Accepts [Joi](https://github.com/hapijs/joi) schemas for `body` (body parser required), `params` and `query` (query parser required). Returns with `400` if the request is not valid. Assigns validated values to `ctx.state.validated`.

```js
const joi = require('joi')
const qs = require('qs')
const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const { koa: middleware } = require('@banzaicloud/service-tools').middleware

// ...

const app = new Koa()
const router = new Router()

const paramsSchema = joi
  .object({
    id: joi
      .string()
      .hex()
      .length(64)
      .required(),
  })
  .required()

const bodySchema = joi.object({ name: joi.string().required() }).required()

const querySchema = joi.object({ include: joi.array().default([]) }).required()

router.get('/', async function routeHandler(ctx) {
  const { params, body, query } = ctx.state.validated
  // ...
})

app.use(bodyParser())
// query parser
app.use(async function parseQuery(ctx, next) {
  ctx.query = qs.parse(ctx.querystring, options)
  ctx.request.query = ctx.query
  await next()
})
app.use(router.routes())
app.use(router.allowedMethods())
```
