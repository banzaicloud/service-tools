<h1 align="center">
  Node.js Service Tools
</h1>

<p align="center">
  <strong>Prepare your Node.js application for production!</strong>
</p>

<div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://circleci.com/gh/banzaicloud/service-tools">
    <img alt="CircleCI" title="CircleCI" src="https://circleci.com/gh/banzaicloud/service-tools.svg?style=svg&circle-token=002bb942365281c0834e18a1cb83e1930c3ce0fa" height="20">
  </a>
  <a target="_blank" rel="noopener noreferrer" href="https://npmjs.com/package/@banzaicloud/service-tools">
    <img alt="npm version" title="npm version" src="https://badge.fury.io/js/%40banzaicloud%2Fservice-tools.svg" height="20">
  </a>
</div>

This library provides common functionalities, like graceful error handling & shutdown, structured JSON logging and several HTTP middleware to make your application truly ready for modern containerised environments, like [Kubernetes](http://kubernetes.io/).

<!-- TOC -->

- [Installation](#installation)
- [Usage](#usage)
  - [Main exports](#main-exports)
    - [`catchErrors(options)`](#catcherrorsoptions)
    - [`gracefulShutdown(handlers, options)`](#gracefulshutdownhandlers-options)
    - [`logger`](#logger)
      - [Use provided logger instead of `console`](#use-provided-logger-instead-of-console)
  - [Config](#config)
    - [`config.environment`](#configenvironment)
    - [`config.pino`](#configpino)
  - [Middleware (Koa)](#middleware-koa)
    - [`errorHandler(options)`](#errorhandleroptions)
    - [`healthCheck(checks, options)`](#healthcheckchecks-options)
    - [`prometheusMetrics(options)`](#prometheusmetricsoptions)
    - [`requestValidator(options)`](#requestvalidatoroptions)
    - [`requestLogger(options)`](#requestloggeroptions)
  - [Middleware (Express)](#middleware-express)
    - [`errorHandler(options)`](#errorhandleroptions-1)
    - [`healthCheck(checks, options)`](#healthcheckchecks-options-1)
    - [`prometheusMetrics(options)`](#prometheusmetricsoptions-1)
    - [`requestValidator(options)`](#requestvalidatoroptions-1)

<!-- /TOC -->

## Installation

```sh
npm i @banzaicloud/service-tools
# or
yarn add @banzaicloud/service-tools
```

## Usage & Examples

This library is written in TypeScript, refer to the published types or the source code for argument and return types.

Examples are available for [Express](https://expressjs.com/) and [Koa](https://koajs.com/) frameworks. Check out the _[examples](/examples)_ folder!

### Main exports

#### `catchErrors(options)`

Catch uncaught exceptions and unhandled Promise rejections. It is not safe to resume normal operation after ['uncaughtException'](https://nodejs.org/api/process.html#process_event_uncaughtexception).

```js
const { catchErrors } = require('@banzaicloud/service-tools')

// ...

// the handlers return a Promise
// the handlers are called in order
catchErrors([closeServer, closeDB])

// the error will be caught and the handlers will be called before exiting
throw new Error()
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

#### `logger`

A [pino](https://github.com/pinojs/pino) structured JSON logger instance configured with [`config.pino`](#config).

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

### Config

Load configurations dynamically.

#### `config.environment`

Uses the `NODE_ENV` environment variable, with accepted values of: production, development, test.

```js
const { config } = require('@banzaicloud/service-tools')
// validates the NODE_ENV environment variable
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

Koa [Prometheus](https://prometheus.io/) metrics endpoint handler. By default it collects some [default metrics](https://github.com/siimon/prom-client#default-metrics).

```js
const Koa = require('koa')
const Router = require('koa-router')
const { koa: middleware } = require('@banzaicloud/service-tools').middleware

// ...

const app = new Koa()
const router = new Router()

router.get('/metrics', middleware.prometheusMetrics())

app.use(router.routes())
app.use(router.allowedMethods())
```

#### `requestValidator(options)`

Koa request validator middleware. Accepts [Joi](https://github.com/hapijs/joi) schemas for `body` (body parser required), `params` and `query` (query parser required). Returns with `400` if the request is not valid. Assigns validated values to `ctx.state.validated`.

```js
const joi = require('@hapi/joi')
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

router.get(
  '/',
  middleware.requestValidator({ params: paramsSchema, body: bodySchema, query: querySchema }),
  async function routeHandler(ctx) {
    const { params, body, query } = ctx.state.validated
    // ...
  }
)

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

#### `requestLogger(options)`

Koa request logger middleware. Useful for local development and debugging.

```js
const Koa = require('koa')
const { koa: middleware } = require('@banzaicloud/service-tools').middleware

// ...

const app = new Koa()

// this should be the second middleware after the error handler
// ...
app.use(middleware.requestLogger())
```

### Middleware (Express)

Several middleware for the [Express](https://expressjs.com/) web framework.

#### `errorHandler(options)`

Express error handler middleware.

```js
const express = require('express')
const { express: middleware } = require('@banzaicloud/service-tools').middleware

const app = express()

// this should be the last middleware
app.use(middleware.errorHandler())
```

#### `healthCheck(checks, options)`

Express health check endpoint handler.

```js
const express = require('express')
const { express: middleware } = require('@banzaicloud/service-tools').middleware

// ...

const app = express()

// the checks return a Promise
app.get('/health', middleware.healthCheck([checkDB]))
```

#### `prometheusMetrics(options)`

Express [Prometheus](https://prometheus.io/) metrics endpoint handler. By default it collects some [default metrics](https://github.com/siimon/prom-client#default-metrics).

```js
const express = require('express')
const { express: middleware } = require('@banzaicloud/service-tools').middleware

// ...

const app = express()

app.get('/metrics', middleware.prometheusMetrics())
```

#### `requestValidator(options)`

Express request validator middleware. Accepts [Joi](https://github.com/hapijs/joi) schemas for `body` (body parser required), `params` and `query`. Returns with `400` if the request is not valid. Assigns validated values to `req`.

```js
const joi = require('@hapi/joi')
const express = require('express')
const { express: middleware } = require('@banzaicloud/service-tools').middleware

// ...

const app = express()

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

app.use(express.json())
app.get(
  '/',
  middleware.requestValidator({ params: paramsSchema, body: bodySchema, query: querySchema }),
  function routeHandler(req, res) {
    const { params, body, query } = req
    // ...
  }
)
```
