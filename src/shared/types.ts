import type { SubscribePayload } from 'graphql-ws'
import type { StrictOmit } from 'ts-strict-utils'

type MessageTypeType = `shr-ws-${string}`

type MessageBaseType<
  MessageTypeTypeParam extends MessageTypeType = MessageTypeType,
> = {
  messageType: MessageTypeTypeParam
}

/** Unique id for Web Sockets. */
export type SocketId = ConstructorParameters<typeof WebSocket>

type MessageToWorkerBaseType<Type extends MessageTypeType> =
  MessageBaseType<Type> & {
    facadeId: string
    socketId: SocketId
  }

/**
 * The messages shared between client in main thread and worker.
 */
export type SharedWsMessages = {
  /**
   * Sent from main thread to worker
   */
  toWorker: {
    /**
     * To get unique id for facade client in main thread.
     */
    getFacadeId: StrictOmit<
      MessageToWorkerBaseType<'shr-ws-get-facade-id'>,
      'facadeId'
    >

    /**
     * To initialize web socket inside worker.
     * The worker creates new, only if a ws with the same graphql-ws client parameters
     *    doesn't already exist.
     */
    init: MessageToWorkerBaseType<'shr-ws-init'>

    send: MessageToWorkerBaseType<'shr-ws-send'> & {
      data: string
    }

    close: MessageToWorkerBaseType<'shr-ws-close'> & {
      args: Parameters<WebSocket['close']>
    }

    /**
     * To restart graphql subscription.
     * It first closes the subscription connection. After that it re-subscribes.
     */
    restartSubscription: MessageToWorkerBaseType<'shr-ws-restart-subscription'> & {
      socketId: SocketId
      subscribePayload: SubscribePayload
    }

    /**
     * To pong the worker.
     */
    pongToWorker: MessageToWorkerBaseType<'shr-ws-pong-to-worker'>
  }

  /**
   * Sent from worker to main thread
   */
  fromWorker: {
    event: MessageBaseType<'shr-ws-event'> & {
      socketId: SocketId
      name: keyof WebSocketEventMap
      event: unknown
    }

    /**
     * New id for the facade client in the main thread.
     */
    facadeId: MessageBaseType<'shr-ws-facade-id'> & {
      id: string
    }
    /**
     * To ping main thread from worker
     */
    pingFromWorker: MessageBaseType<'shr-ws-ping-from-worker'>
  }
}

/**
 * Messages sent to the worker.
 */
export type MessageToWorker =
  SharedWsMessages['toWorker'][keyof SharedWsMessages['toWorker']]

/**
 * Messages sent from the worker.
 */
export type MessageFromWorker =
  SharedWsMessages['fromWorker'][keyof SharedWsMessages['fromWorker']]

/**
 * Base type for messages sent from the worker to the main thread.
 */
export type ShrWsFromWorkerMessageBaseType = {
  socketId: SocketId
}

/**
 * Callback functions in Client Options which can be exectued in the main thread itself.
 * These functions are either async or returns void.
 *    Otherwise they should be executed in the worker thread.
 */
export type AsyncClientOptionsType = Extract<
  keyof SocketId,
  'url' | 'connectionParams' | 'onNonLazyError' | 'retryWait'
>

/**
 * The union of all the messages sent either to or from worker.
 */
export type ShrClientMessagesUnion =
  | SharedWsMessages['fromWorker'][keyof SharedWsMessages['fromWorker']]
  | SharedWsMessages['toWorker'][keyof SharedWsMessages['toWorker']]

/**
 *  Type guard for {@link ShrClientMessagesUnion}.
 */
export const isShrWsMessage = (
  message: unknown
): message is ShrClientMessagesUnion => {
  const typeKey: keyof MessageBaseType = 'messageType'
  return (
    typeof message === 'object' &&
    message !== null &&
    (typeKey satisfies keyof MessageBaseType) in message &&
    typeof message[typeKey] === 'string' &&
    message[typeKey].startsWith('shr-ws-')
  )
}

/**
 * Type guard for {@link ShrClientMessagesUnion | messages with shared worker}.
 */
export const shrWsMessageTypeGuard = <
  MessageType extends ShrClientMessagesUnion,
>(
  message: unknown,
  narrowBy: MessageType['messageType']
): message is Extract<ShrClientMessagesUnion, MessageType> =>
  isShrWsMessage(message) && message.messageType === narrowBy
