# Express example

```sh
$ npm install
$ PORT=8080 node .
# > {"level":30,"time":1534324546995,"msg":"server is listening on port 8080","pid":7453,"hostname":"andras-imac.t.hu","v":1}

# 1. call the metrics endpoint (can be consumed by Prometheus)
$ curl http://localhost:8080/metrics

# 2. call the health check endpoint (the fake check fails 20% of the times)
$ curl http://localhost:8080/health

# 3. hit ctrl+C to kill the application
$ ^C
# > {"level":30,"time":xxx,"msg":"got kill signal (SIGINT), starting graceful shut down","pid":1,"hostname":"local","v":1}
```
