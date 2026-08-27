import type { RecognizedString, us_listen_socket } from 'uWebSockets.js'

/**
 *  Info on whether the server is accepting new connections, shutting down, etc...
 */
export type ListeningStatusType = {
  acceptingNewConnections?: boolean
  listenSocket?: us_listen_socket
  shuttingDown?: boolean
  reasonFoNotAccepting?: RecognizedString
}
