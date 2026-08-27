/**
 * Starts the server.
 * @packageDocumentation
 */
import { logger } from '@packages/logger'
import config from './config'
import { setupGracefulShutdown } from './lib/graceful-shutdown'
import { listeningStatus } from './util/graphqlApiHandler'
import { uWS } from './uWS'

uWS
  .any('/*', (res, req) => {
    res.writeStatus('200 OK').end()
  })
  .listen(config.port, (listenSocket) => {
    logger.info(`Visit https://localhost:${config.port}/api/graphql`)
    logger.info(`Visit https://localhost:${config.port}/`)
    logger.info(`timestamp is ${Date.now()} ${new Date()}`)

    listeningStatus.acceptingNewConnections = true
    listeningStatus.listenSocket = listenSocket

    setupGracefulShutdown(uWS, listeningStatus)
  })
