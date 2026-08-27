/**
 * @packageDocumentation
 * @see uWS - {@link uWS}
 */
import path from 'path'
import { SSLApp } from 'uWebSockets.js'
import { graphqlApiHandler } from './util/graphqlApiHandler'
import { graphqlWsHandler } from './util/graphqlWsHandler'

/**
 * The uWebSockets server app instance.
 * All the routes and handlers are mounted onto this instance.
 */
export const uWS = SSLApp({
  cert_file_name: path.join(import.meta.dirname, `./cert/cert.pem`),
  key_file_name: path.join(import.meta.dirname, `./cert/cert.key`),
})
// export const uWS = SSLApp({
//   cert_file_name: path.join(import.meta.dirname, `./cert/cert.pem`),
//   key_file_name: path.join(import.meta.dirname, `./cert/cert.key`),
// })

uWS.any('/api/*', graphqlApiHandler).ws('/api/*', graphqlWsHandler)
