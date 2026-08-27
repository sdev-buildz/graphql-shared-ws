import { getNormalizedPayload } from '@shared/getNormalizedPayload'
import {
  createClient,
  type Client,
  type Sink,
  type SubscribePayload,
} from 'graphql-ws'
import { TypedObjKeyedMap } from 'ts-strict-utils'
import { SharedWebSocket } from './SharedWebSocket'

/**
 * graphql-ws client with its WebSocket shared across browsing contexts. (such as browser tabs, windows, or iframes)
 */
export type SharedClient = Client & {
  restartSubscription: (payload: SubscribePayload, sink?: Sink) => () => void
}

/**
 * Configuration options to create {@link SharedClient}.
 */
export type SharedClientOptions = Omit<
  Parameters<typeof createClient>[0],
  'webSocketImpl'
> & {
  webSocketImpl?: typeof SharedWebSocket
}

/**
 * Creates a graphql-ws client with its WebSocket shared across browsing contexts. (such as browser tabs, windows, or iframes)
 * @example
 * ```ts
 * import { createSharedClient } from 'graphql-shared-ws'
 *
 * // create a client.
 * const sharedClient = createSharedClient({ url: 'wss://example.com/api/graphql' })
 *
 * // make a grpahql subscription
 * sharedClient.subscribe(
 *  {
 *    query: `
 *      subscription listenToMessages {
 *        messageBroadcasted
 *      }
 *    `,
 *  },
 *  {
 *    next: n => {
 *      console.log(`Last broadcasted message =`, n.data.messageBroadcasted)
 *    },
 *    complete: () => {
 *      console.log('subscription closed.')
 *    },
 *    error: console.error
 *  }
 * )
 * ```
 */
export const createSharedClient = (
  options: SharedClientOptions
): SharedClient => {
  options.webSocketImpl = SharedWebSocket
  const client = createClient(options)

  const sinks: TypedObjKeyedMap<SubscribePayload, Sink> = new TypedObjKeyedMap()

  return {
    ...client,
    subscribe: (payload, sink) => {
      sinks.set(getNormalizedPayload(payload), sink)
      return client.subscribe(payload, sink)
    },
    restartSubscription: (payload, sink) => {
      if (sink) sinks.set(getNormalizedPayload(payload), sink)
      else sink = sinks.get(getNormalizedPayload(payload))

      if (!sink)
        throw new Error(
          `The subscription to restart doesn't already exist. Sink is also not provided.`
        )

      return client.subscribe(
        {
          ...payload,
          extensions: {
            ...payload.extensions,
            restartSubscription: true,
          },
        },
        sink
      )
    },
  }
}
