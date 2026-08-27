import {
  isGqlWsMsg,
  type ExtractMessageTypeByType,
  type GqlWsMsgTypes,
} from '@shared/graphql-ws-messages.types'
import type { SharedWsMessages, SocketId } from '@shared/types'
import {
  MessageType,
  type ClientOptions,
  type SubscribePayload,
} from 'graphql-ws'
import { typedObjectEntries, TypedObjKeyedMap } from 'ts-strict-utils'
import { getNormalizedPayload } from '../../shared/getNormalizedPayload'
import { SerializingSet } from '../util/SerializingSet'
import type { FacadeSocket } from '../util/types'

/** GraphQL subscription channel in WebSocket connection. */
type Channel = {
  channelId: string
  payload: SubscribePayload
  facade: FacadeSocket
}

/** GraphQL subscription */
type Subscription = Omit<Channel, 'facade'> & {
  subscribers: SerializingSet<{
    facadeId: FacadeSocket['id']
    channelId: Channel['channelId']
  }>
}

class InflightSubscriptions extends TypedObjKeyedMap<
  SubscribePayload,
  Subscription
> {
  override set(key: SubscribePayload, value: Subscription) {
    super.set(getNormalizedPayload(key), value)
    return this
  }

  override get(key: SubscribePayload) {
    return super.get(getNormalizedPayload(key))
  }

  override has(key: SubscribePayload) {
    return !!super.get(getNormalizedPayload(key))
  }

  override delete(key: SubscribePayload) {
    return !!super.delete(getNormalizedPayload(key))
  }
}

/**
 * WebSocket in shared worker.
 * It is shared across browsing contexts.
 */
export class CoreWebSocket {
  protected connectionInitState: undefined | 'init' | 'ack'

  /** The close event sent from server, if sent. */
  protected closeEvent: Pick<
    CloseEvent,
    'code' | 'reason' | 'wasClean'
  > | null = null

  /** The active inflight subscription channels in this socket. */
  public readonly inflightSubscriptions: InflightSubscriptions =
    new InflightSubscriptions()

  /** inflightSubscriptions but indexed by {@link Channel.channelId} */
  public readonly channelIdToSubscriptionMap: Map<
    Channel['channelId'],
    Subscription
  > = new Map()
  public readonly facades: Set<FacadeSocket> = new Set()

  /** Facades waiting for {@link MessageType.ConnectionAck} message. */
  protected readonly connAckQueue: Set<FacadeSocket> = new Set()

  constructor(
    public readonly webSocket: WebSocket,
    public readonly socketId: SocketId,
    /**
     * Disposes this socket.
     * After dispose, if new facade sockets are opened with the same parameters as that of this,
     *  a new socket is created.
     */
    public readonly dispose: () => void
    /** The Facade Sockets which were opened with this socket's parameters, thus sharing this socket. */
  ) {
    this.setupEventListeners()
  }

  /**
   * Adds a new facade to this socket.
   * Called when a new facade is created with the same parameters as those of this.
   */
  addFacade(facade: FacadeSocket) {
    this.facades.add(facade)
    if (this.webSocket.readyState === WebSocket.OPEN) {
      facade.postMessage({
        messageType: 'shr-ws-event',
        name: 'open',
        socketId: this.socketId,
        event: {},
      } satisfies SharedWsMessages['fromWorker']['event'])
      return
    }

    if (this.webSocket.readyState === WebSocket.CLOSED) {
      facade.postMessage({
        messageType: 'shr-ws-event',
        name: 'close',
        socketId: this.socketId,
        event: this.closeEvent,
      } satisfies SharedWsMessages['fromWorker']['event'])
      return
    }
  }

  /** Handles events sent from server. */
  protected setupEventListeners() {
    // TS ensures all the possible values from union type are included as keys.
    const eventNamesMap: Record<
      SharedWsMessages['fromWorker']['event']['name'],
      null
    > = {
      close: null,
      error: null,
      message: null,
      open: null,
    }

    // forwarding web socket events to main thread.
    for (const [eventName] of typedObjectEntries(eventNamesMap)) {
      this.webSocket.addEventListener(eventName, (event) => {
        const messageToPost = {
          messageType: 'shr-ws-event',
          name: eventName,
          socketId: this.socketId,
          event: {},
        } satisfies SharedWsMessages['fromWorker']['event']

        if (event instanceof MessageEvent) {
          messageToPost.event = {
            data: event.data as string,
          }
          const parsedMessage: GqlWsMsgTypes | undefined = JSON.parse(
            event.data
          )

          if (parsedMessage!.type === MessageType.ConnectionAck) {
            this.connectionInitState = 'ack'
            this.connAckQueue.forEach((facade) => {
              facade.postMessage(messageToPost)
            })
            this.connAckQueue.clear()
            return
          }

          for (const facade of this.facades) {
            if (parsedMessage && 'id' in parsedMessage) {
              // Message from server has a channel id. So the message is a response to a GraphQL operation.
              //  If the operation was GraphQL subscription, the channel id should be modified to that of the facade.
              const subscription = this.channelIdToSubscriptionMap.get(
                parsedMessage.id
              )

              if (subscription) {
                //  It is a response to a GraphQL subscription.
                //  This condition would be false for single result operations,
                //    namely GraphQL query and mutation operations.
                for (const subscriber of subscription.subscribers) {
                  if (subscriber.facadeId !== facade.id) continue
                  messageToPost.event = {
                    data: JSON.stringify({
                      ...parsedMessage,
                      //  Setting the channel id.
                      id: subscriber.channelId,
                    }),
                  }
                  facade.postMessage(messageToPost)
                }
                continue
              }
            }
            //  The message is a response to a single result operation (query or mutation).
            facade.postMessage(messageToPost)
          }
          return
        } else if (event instanceof CloseEvent) {
          messageToPost.event = {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          }
          this.closeEvent = event
          //  Disposing doesn't stop the socket forcefully.
          //  It allows the socket to be gracefully garbage collected.
          this.dispose()
        } else {
          messageToPost.event = {}
        }

        for (const facade of this.facades) {
          facade.postMessage(messageToPost)
        }
      })
    }
  }

  /** Performs GraphQL Subscriptions */
  public subscribe(newChannel: Channel) {
    const subscriptionExists = this.inflightSubscriptions.has(
      newChannel.payload
    )
    if (!subscriptionExists) {
      //  Create a new susbcription if it doesn't already exist.
      const subscription: Subscription = {
        channelId: newChannel.channelId,
        payload: newChannel.payload,
        subscribers: new SerializingSet(),
      }
      this.inflightSubscriptions.set(newChannel.payload, subscription)

      this.webSocket.send(
        JSON.stringify({
          type: MessageType.Subscribe,
          id: newChannel.channelId,
          payload: newChannel.payload,
        } satisfies GqlWsMsgTypes)
      )
    }

    const subscription = this.inflightSubscriptions.get(newChannel.payload)!

    //  Add the facade to the subscribers set.
    subscription.subscribers.add({
      facadeId: newChannel.facade.id,
      channelId: newChannel.channelId,
    })
    this.channelIdToSubscriptionMap.set(newChannel.channelId, subscription)
  }

  /** Unsubscribes from GraphQL Subscriptions */
  public unsubscribe(channel: {
    id: Channel['channelId']
    facade: FacadeSocket
  }) {
    const subscription = this.channelIdToSubscriptionMap.get(channel.id)
    if (!subscription) {
      console.error(`Subscription to unsubscribe doesn't exist`)
      return
    }

    for (const subscriber of subscription.subscribers)
      //  Remove the facade from the subscribers set.
      if (subscriber.facadeId === channel.facade.id) {
        subscription.subscribers.delete(subscriber)
        break
      }

    if (subscription.subscribers.size === 0) {
      //  If no subscribers left, delete the subscription and unsubscribe from the server.
      this.inflightSubscriptions.delete(subscription.payload)
      this.channelIdToSubscriptionMap.delete(channel.id)
      this.webSocket.send(
        JSON.stringify({
          type: MessageType.Complete,
          id: subscription.channelId,
        } satisfies GqlWsMsgTypes)
      )
    }
  }

  /** handles WebSocket.send requests from facades. */
  public send(message: string, facade: FacadeSocket) {
    const parsedMessage = JSON.parse(message)
    if (!isGqlWsMsg(parsedMessage)) return
    switch (parsedMessage.type) {
      case MessageType.ConnectionInit: {
        if (!this.connectionInitState) {
          //  The first connectionInit is sent to the server.
          this.connectionInitState = 'init'
          this.webSocket.send(message)
          this.connAckQueue.add(facade)
          return
        }
        if (this.connectionInitState === 'ack') {
          // The connection is already acked because of init message from a different facade.
          facade.postMessage({
            messageType: 'shr-ws-event',
            name: 'message',
            event: {
              data: JSON.stringify({
                type: MessageType.ConnectionAck,
              } satisfies GqlWsMsgTypes),
            },
            socketId: this.socketId,
          } satisfies SharedWsMessages['fromWorker']['event'])
          return
        }
        //  Connection init was already sent by a different facade. Ack is not yet received.
        this.connAckQueue.add(facade)
        return
      }

      case MessageType.Subscribe: {
        if (!parsedMessage.payload.query.trim().startsWith('subscription'))
          break
        if (parsedMessage.payload.extensions?.restartSubscription) {
          this.restartSubscription(parsedMessage)
          return
        }
        this.subscribe({
          facade,
          channelId: parsedMessage.id,
          payload: parsedMessage.payload,
        })
        return
      }

      case MessageType.Complete: {
        this.unsubscribe({ id: parsedMessage.id, facade })
        return
      }
    }
    // Single result GraphQL operations namely query and mutation are sent here.
    //  Ping and Pong messages are also sent here.
    this.webSocket.send(message)
  }

  /** handles WebSocket.close requests from facades. */
  public close(args: Parameters<WebSocket['close']>, facade: FacadeSocket) {
    for (const [, subscription] of this.inflightSubscriptions.entries()) {
      for (const subscriber of subscription.subscribers) {
        if (subscriber.facadeId === facade.id)
          this.unsubscribe({ id: subscriber.channelId, facade })
      }
    }
    for (const facadeIter of this.facades) {
      if (facadeIter.id === facade.id) {
        this.facades.delete(facadeIter)
        break
      }
    }
    if (this.facades.size === 0) {
      this.webSocket.close(...args)
      this.dispose()
    }
  }

  /**
   * Closes and reopens subscription channel.
   * Subscribers are not notified about the closing because they could stop listening.
   */
  public restartSubscription(
    message: ExtractMessageTypeByType<MessageType.Subscribe>
  ) {
    delete message.payload.extensions?.restartSubscription
    const subscription = this.inflightSubscriptions.get(message.payload)
    if (!subscription) {
      return
    }
    const channelId = subscription.channelId

    this.webSocket.send(
      JSON.stringify({
        type: MessageType.Complete,
        id: channelId,
      } satisfies GqlWsMsgTypes)
    )
    subscription.channelId = message.id

    this.channelIdToSubscriptionMap.delete(channelId)
    this.channelIdToSubscriptionMap.set(subscription.channelId, subscription)

    this.webSocket.send(JSON.stringify(message satisfies GqlWsMsgTypes))
  }
}

class WebSocketsInWorker extends TypedObjKeyedMap<SocketId, CoreWebSocket> {
  /** Creates a new WebSocket. */
  public create(
    socketId: SocketId,
    /** The facade which requested this creation. */
    facade: FacadeSocket,
    webSocketImpl: ClientOptions['webSocketImpl'] = WebSocket
  ) {
    if (!this.has(socketId)) {
      const coreWebSocket: CoreWebSocket = new CoreWebSocket(
        new (webSocketImpl as typeof WebSocket)(...socketId),
        socketId,
        () => this.delete(socketId)
      )
      this.set(socketId, coreWebSocket)
    }
    const coreWebSocket = this.get(socketId)!
    coreWebSocket.addFacade(facade)

    return coreWebSocket
  }
}

/**
 * The WebSocket instances inside worker.
 * The instances are indexed by their constructor parameters.
 */
export const webSocketsInWorker = new WebSocketsInWorker()
