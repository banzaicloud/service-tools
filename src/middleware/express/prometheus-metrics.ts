import { Request, RequestHandler, Response } from 'express'
import * as promClient from 'prom-client'

export default function prometheusMetricsFactory({
  client = promClient,
  collectDefaultMetrics = true,
  defaultLabels = {},
} = {}): RequestHandler {
  if (collectDefaultMetrics) {
    client.collectDefaultMetrics()
  }

  if (Object.keys(defaultLabels).length) {
    client.register.setDefaultLabels(defaultLabels)
  }

  return function prometheusMetrics(req: Request, res: Response) {
    const metrics = client.register.metrics()
    res.set('Content-Type', client.register.contentType).send(metrics)
  }
}
