import {
  GRAPHQL_TRANSPORT_WS_PROTOCOL,
  makeServer,
  type WebSocket as ServerWebSocket,
} from 'graphql-ws'
import type { StrictOmit } from 'ts-strict-utils'
import { vi, type Mock } from 'vitest'
import { waitForNextTick } from '../lib/waitForNextTick'
import { schema } from './server'

const mockServer = makeServer({
  schema: schema,
})

/**
 * Mock for {@link ServerWebSocket} created inside shared worker.
 */
export const MockWebSocket: Mock<typeof WebSocket> = vi.fn(
  class
    extends WebSocket
    implements
      StrictOmit<
        WebSocket,
        'binaryType' | 'bufferedAmount' | 'extensions' | 'protocol'
      >
  {
    protected listeners: {
      [Key in keyof WebSocketEventMap]: Array<
        (event: WebSocketEventMap[Key]) => void
      >
    } = {
      open: [],
      close: [],
      error: [],
      message: [],
    }
    sendMessageToServer: Parameters<ServerWebSocket['onMessage']>[0] =
      async () => {}

    _readyState: WebSocket['readyState'] = WebSocket.CONNECTING
    constructor(...args: ConstructorParameters<typeof WebSocket>) {
      super(...args)

      // Define getter directly on the instance ('this')
      Object.defineProperty(this, 'readyState', {
        get: () => this._readyState,
        configurable: true,
      })
      if (typeof args[0] === 'string' && args[0].includes('invalid')) {
        this.stimulateConnError()
        return
      }
      this.openConnection()
    }

    protected stimulateConnError = vi.fn(async () => {
      //  Wait for event listeners to be added to the WebSocket.
      await waitForNextTick()
      this.dispatchEvent(new Event('error'))
      this.dispatchEvent(new CloseEvent('error'))
    })

    protected openConnection = vi.fn(async () => {
      /** Used by server to interact with client. */
      const serverSocket: ServerWebSocket = {
        send: (data) => {
          this.dispatchEvent(new MessageEvent('message', { data }))
        },
        close: (code, reason) => {
          this.listeners.close.forEach((l) =>
            l(
              new CloseEvent('close', {
                code: code ?? 1000,
                reason: reason ?? '',
                wasClean: true,
              }) as unknown as CloseEvent
            )
          )
        },
        onMessage: (cb) => {
          this.sendMessageToServer = cb
        },
        protocol: GRAPHQL_TRANSPORT_WS_PROTOCOL,
      }

      this._readyState = WebSocket.OPEN
      const closeSocket = mockServer.opened(serverSocket, {})
      this.close = vi.fn(async () => {
        this._readyState = WebSocket.CLOSING
        await closeSocket()
        this._readyState = WebSocket.CLOSED
      })

      //  Waiting for event listeners to be added to the WebSocket.
      //  In real world scenerio, this is not required because of turn around time of the ws network requests.
      await waitForNextTick()

      //  Set the socket state to OPEN.
      this.dispatchEvent(new Event('open'))
    })

    override dispatchEvent = vi.fn(
      (event: WebSocketEventMap[keyof WebSocketEventMap]) => {
        const eventName = event.type as keyof WebSocketEventMap
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.listeners[eventName].forEach((listener) => listener(event as any))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this[`on${eventName}`]?.(event as any)
        return true
      }
    )

    override addEventListener = vi.fn(
      <K extends keyof WebSocketEventMap>(
        type: K,
        listener: (event: WebSocketEventMap[K]) => void
      ) => {
        this.listeners[type].push(listener)
      }
    )

    override send = vi.fn((...[data]: Parameters<ServerWebSocket['send']>) => {
      this.sendMessageToServer?.(data)
    })

    override close = vi.fn()
  } as unknown as typeof WebSocket
)
