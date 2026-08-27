import type { HttpRequest, HttpResponse } from 'uWebSockets.js'
import type { CustomGraphqlContextType } from '../schema/lib/builder'
import { decryptJwe } from './jwe'
import type { User } from './types'

/**
 *  Authenticates the user by parsing the bearer token in the HTTP Authorization header.
 */
export const authenticate = (context: GraphqlContextType): User | undefined => {
  const authHeader = isWsContext(context)
    ? context.connectionParams?.headers?.authorization
    : context.res.authHeader

  if (!authHeader) return
  const bearerToken = authHeader.startsWith('bearer ')
    ? authHeader.slice('bearer '.length)
    : authHeader

  const jwtPayload = decryptJwe(bearerToken)

  if (!jwtPayload) return

  const user = JSON.parse(jwtPayload)
  const currentUser = user
  return currentUser
}

/**
 * The GraphQL context for HTTP requests.
 * Passed to GraphQL resolvers
 */
type HttpContextType = {
  req: HttpRequest
  res: HttpResponse
} & CustomGraphqlContextType

/**
 * The GraphQL context for web socket requests.
 * Passed to GraphQL resolvers
 */
export type WsContextType = {
  connectionInitReceived: boolean
  acknowledged: boolean
  subscriptions: { '69ec209e-f8fc-4ca4-9411-04b77ca8a468': null }
  extra: {
    // socket: uWS.SSLWebSocket { persistedRequest: [Object] }
    // socket: WebSocket
    persistedRequest: {
      method: 'get'
      url: string
      query: unknown
      headers: Record<
        | 'host'
        | 'connection'
        | 'pragme'
        | 'upgrade'
        | 'origin'
        | 'accept-language'
        | 'sec-websocket-key'
        | 'sec-websocket-extensions'
        | 'sec-websocket-protocol',
        string
      >
    }
  }
  connectionParams: {
    headers?: {
      authorization?: string
    }
  }
}

/**
 * The context object passed to the GraphQL resolvers
 */
export type GraphqlContextType = HttpContextType | WsContextType

/**
 * Type guard for {@link WsContextType}
 */
export const isWsContext = (
  context: GraphqlContextType
): context is WsContextType => {
  return ('extra' satisfies keyof WsContextType) in context
}
