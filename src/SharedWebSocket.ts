import { shrWsMessageTypeGuard, type SharedWsMessages } from '@shared/types'
import {
  WorkerHandle,
  type SharedWorkerOptions,
} from './util/WorkerHandle/SharedWorkerHandle'
import { getSharedWorkerStateEmitter } from './util/WorkerHandle/getSharedWorkerStateEmitter'

/**
 * Creates a WebSocket connection shared across browsing contexts using shared worker.
 * @example
 * ```ts
 * import { SharedWebSocket } from 'graphql-shared-ws'
 * import { createClient } from 'graphql-ws'
 *
 * // create a client.
 * const sharedClient = createClient({ url: 'wss://example.com/api/graphql',
 *  //  pass the SharedWebSocket as the webSocketImpl
 *  webSocketImpl: SharedWebSocket
 * })
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
export class SharedWebSocket implements Pick<
  WebSocket,
  'close' | 'onclose' | 'onerror' | 'onopen' | 'onmessage' | 'readyState'
> {
  public static CLOSED = WebSocket.CLOSED
  public static CLOSING = WebSocket.CLOSING
  public static CONNECTING = WebSocket.CONNECTING
  public static OPEN = WebSocket.OPEN

  protected workerHandle: WorkerHandle
  protected readyStateSource: WebSocket['readyState'] = WebSocket.CONNECTING
  get readyState() {
    return this.readyStateSource
  }

  protected eventListeners: {
    [EventName in keyof WebSocketEventMap]: Array<
      (event: WebSocketEventMap[EventName]) => void
    >
  } = {
    open: [],
    message: [],
    close: [],
    error: [],
  }
  protected readonly wsOptions: ConstructorParameters<typeof WebSocket>

  constructor(
    protected readonly url: ConstructorParameters<typeof WebSocket>[0],
    protected readonly protocols: ConstructorParameters<typeof WebSocket>[1],
    protected readonly workerOptions?: SharedWorkerOptions
  ) {
    this.wsOptions = [url, protocols]

    const sharedWorkerStateEmitter = getSharedWorkerStateEmitter()

    sharedWorkerStateEmitter.addListener('error', () => {
      ;(this as unknown as WebSocket).onerror?.(new Event('error'))
    })

    this.workerHandle = new WorkerHandle(
      this.wsOptions,
      sharedWorkerStateEmitter.emit
    )

    this.setupEventListeners()
  }

  send(data: string): void {
    this.workerHandle.postMessage({
      messageType: 'shr-ws-send',
      data,
      socketId: this.wsOptions,
      facadeId: this.workerHandle.facadeId,
    })
  }

  close(...args: Parameters<WebSocket['close']>): void {
    this.workerHandle.postMessage({
      messageType: 'shr-ws-close',
      args,
      socketId: this.wsOptions,
      facadeId: this.workerHandle.facadeId,
    })
  }

  setupEventListeners() {
    this.workerHandle.addMessageEventListener((event) => {
      if (
        !shrWsMessageTypeGuard<SharedWsMessages['fromWorker']['event']>(
          event.data,
          'shr-ws-event'
        )
      )
        return
      // console.log('in shared socket event listener. event.data =',event.data)
      for (const listener of this.eventListeners[event.data.name]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        listener(event.data.event as any)
      }
      switch (event.data.name) {
        case 'open': {
          this.readyStateSource = WebSocket.OPEN
          ;(this as unknown as WebSocket).onopen?.(event.data.event as Event)
          break
        }
        case 'message': {
          ;(this as unknown as WebSocket).onmessage?.(
            event.data.event as MessageEvent
          )
          break
        }
        case 'close': {
          this.readyStateSource = WebSocket.CLOSED
          ;(this as unknown as WebSocket).onclose?.(
            event.data.event as CloseEvent
          )
          break
        }
        case 'error': {
          ;(this as unknown as WebSocket).onerror?.(
            event.data.event as CloseEvent
          )
          break
        }
      }
    })
  }

  onopen: WebSocket['onopen'] = null
  onclose: WebSocket['onclose'] = null
  onmessage: WebSocket['onmessage'] = null
  onerror: WebSocket['onerror'] = null
}
