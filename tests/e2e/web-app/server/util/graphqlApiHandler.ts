import type { HttpRequest, HttpResponse, TemplatedApp } from 'uWebSockets.js'
import type { ListeningStatusType } from '../lib/uWSHelpers'
import { yoga } from './yogaServerInstance'

// yoga's envelop may augment the `execute` and `subscribe` operations
// so we need to make sure we always use the freshest instance

/**
 * @see {@link ListeningStatusType}
 */
export const listeningStatus: ListeningStatusType = {}

/**
 * The GraphQL api route handler
 */
export const graphqlApiHandler: Parameters<TemplatedApp['any']>[1] = (
  res,
  req
) => {
  if (!listeningStatus.acceptingNewConnections) {
    /**
     * Ignores the connection if the server is under graceful shutdown.
     */
    res.cork(() => {
      res.writeStatus('503 Service Unavailable')
      res.end(
        `Server stopped listening. Reason: ${listeningStatus.reasonFoNotAccepting ?? 'Unknown'}`,
        true
      )
    })
    return
  }

  /** The value of the Authorization header in the incoming HTTP request */
  const authHeader = req.getHeader('authorization')
  const reqOrigin = req.getHeader('origin')
  /**
   * Storing the value of the Authorization header in the {@link HttpResponse | res} object.
   *  Because uWS erases the headers in the {@link HttpRequest | req} object when it
   *    encounters any await statements.
   *  GraphQL Yoga seems to 'await' before allowing us to set the currentUser object in context.
   *    We would need the value of the Authorization header when authenticating the user.
   *  @see Reference {@link https://github.com/uNetworking/uWebSockets.js/discussions/328#discussioncomment-173449}
   */
  res.authHeader = authHeader
  res.reqOrigin = reqOrigin
  /**
   * The GraphQL server is mounted on '/graphql'
   */
  yoga(res, req)
}
