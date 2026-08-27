/**
 * @packageDocumentation
 * {@inheritDoc setupGracefulShutdown}
 */
import { logger } from '@packages/logger'
import { us_listen_socket_close, type TemplatedApp } from 'uWebSockets.js'
import type { ListeningStatusType } from './uWSHelpers'

/**
 * Sets up the event listeners which initiate graceful shutdown.
 */
export function setupGracefulShutdown(
  uWS: TemplatedApp,
  listeningStatus: ListeningStatusType
) {
  process.on('SIGTERM', () => initiateGracefulShutdown(uWS, listeningStatus))
  process.on('SIGINT', () => initiateGracefulShutdown(uWS, listeningStatus))
}

/**
 * Initiates graceful shutdown.
 *
 * It stops the app from accepting new connections.
 * But allows the already existing connections to remain and get served.
 *
 * Even if the terminal running this app gets control back,
 *  the nodejs app would still be running in the background, in case there are existing connections.
 * Once all the existing connections are served and closed, the app will automatically go out of scope
 *  and the memory will gracefully be deleted.
 * @see Reference {@link https://github.com/uNetworking/uWebSockets/blob/master/misc/READMORE.md#apprun-and-fallthrough | link}
 */
async function initiateGracefulShutdown(
  uWS: TemplatedApp,
  listeningStatus: ListeningStatusType
) {
  logger.info('Initiating graceful shutdown...')

  if (!listeningStatus.listenSocket) {
    uWS.close()
    return
  }

  /**
   * Stopping new connections.
   */
  us_listen_socket_close(listeningStatus.listenSocket)

  listeningStatus.acceptingNewConnections = false
  listeningStatus.shuttingDown = true
  listeningStatus.reasonFoNotAccepting =
    'The server is under graceful shutdown.'

  logger.info(
    `Server stopped accepting new connections. Any existing open connections are being served before complete shut down.`
  )
}
