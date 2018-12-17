/**
 * Request function for testing routes on localhost
 */

import * as http from 'http'
import { AddressInfo } from 'net'
import * as request from 'request-promise-native'
import { promisify } from 'util'

/**
 * Starts the server on localhost and makes a request with the specified options
 */
export default async function makeRequest(
  server: http.Server,
  options?: request.RequestPromiseOptions & { endpoint: string }
) {
  if (!(server instanceof http.Server)) {
    throw new TypeError('Parameter server is required to be an http.Server instance')
  }

  const serverListen: any = promisify(server.listen).bind(server)
  const serverClose = promisify(server.close).bind(server)

  // bind the server to a free port on localhost
  const hostname = '127.0.0.1'
  await serverListen(0, hostname)
  const { port } = server.address() as AddressInfo

  // make the request
  const { endpoint = '/', ...requestOptions } = options || {}
  const uri = `http://${hostname}:${port}${endpoint}`
  const response = await request({
    uri,
    json: true,
    resolveWithFullResponse: true,
    simple: false,
    ...requestOptions,
  })

  // close the server
  await serverClose()

  return response
}
