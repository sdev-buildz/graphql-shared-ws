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
 * A graphql-ws client whose WebSocket connection is shared across browsing
 * contexts, such as browser tabs, windows, and iframes.
 *
 * GraphQL subscriptions are indexed by their payloads, preventing duplicate subscription channels.
 *
 * In addition to the standard graphql-ws client methods, this client exposes
 * {@link SharedClient.restartSubscription} for restarting an existing
 * subscription.
 */
export type SharedClient = Client & {
  restartSubscription: (payload: SubscribePayload, sink?: Sink) => () => void
}

/**
 * Configuration options for creating a {@link SharedClient}.
 */
export type SharedClientOptions = Omit<
  Parameters<typeof createClient>[0],
  'webSocketImpl'
> & {
  webSocketImpl?: typeof SharedWebSocket
}

/**
 * Creates a graphql-ws client whose WebSocket connection is shared across
 * browsing contexts, such as browser tabs, windows, and iframes.
 *
 * GraphQL subscriptions are indexed by their payloads, preventing duplicate subscription channels.
 *
 * In addition to the standard graphql-ws client methods, this client exposes
 * {@link SharedClient.restartSubscription} for restarting an existing
 * subscription.
 * @example
 * ```ts
 * import { createSharedClient } from 'graphql-shared-ws'
 *
 * // Create a client.
 * const sharedClient = createSharedClient({ url: 'wss://example.com/api/graphql' })
 *
 * // Create a GraphQL subscription.
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

  /**
   * Stores the sink for each subscription so it can be reused when the
   * subscription is restarted.
   */
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
