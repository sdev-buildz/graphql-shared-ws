/**
 * Messages shared between main thread and SharedWorker thread.
 * @packageDocumentation
 */

import { MessageType, type SubscribePayload } from 'graphql-ws'

/**
 * Augmented type field of messages sent over graphql-ws WebSocket.
 * Augmented to support restarting subscriptions.
 */

const ShrMessageType = {
  ...MessageType,
  RestartSubscription: 'restart_subscription', // Choose your wire-protocol string value
} as const

type ShrMessageType = typeof ShrMessageType

/**
 *  Messages sent through web socket as per graphql-ws protocol.
 */
export type GqlWsMsgTypes =
  | {
      type: MessageType.ConnectionInit
      payload?: unknown
    }
  | {
      type: MessageType.ConnectionAck
    }
  | {
      type: MessageType.Ping
    }
  | {
      type: MessageType.Pong
      payload?: unknown
    }
  | {
      id: string
      type: MessageType.Subscribe
      payload: SubscribePayload
    }
  | {
      id: string
      type: MessageType.Next
      payload: unknown
    }
  | {
      id: string
      type: MessageType.Complete
    }
  | {
      id: string
      type: MessageType.Error
      payload: unknown
    }
  | {
      id: string
      type: Pick<ShrMessageType, 'RestartSubscription'>
      payload: SubscribePayload
    }

/**
 * Extracts a type from {@link GqlWsMsgTypes} union type.
 */
export type ExtractMessageTypeByType<TypeName extends MessageType> = {
  [Type in GqlWsMsgTypes as string]: Type['type'] extends TypeName
    ? Type
    : never
}[string]

/**
 * Type guard for {@link GqlWsMsgTypes}.
 */
export const isGqlWsMsg = (message: unknown): message is GqlWsMsgTypes => {
  if (
    message &&
    typeof message === 'object' &&
    'type' in message &&
    Object.values(MessageType).includes(message.type as MessageType)
  )
    return true
  return false
}
