import type { ClientOptions } from 'graphql-ws'
import { vi } from 'vitest'
import {
  connectListener,
  handleMessageEvent,
} from '../../../src/for-worker-thread'

class MockMessagePort implements Pick<
  MessagePort,
  'addEventListener' | 'postMessage' | 'onmessage'
> {
  protected portStartCalled: boolean = false
  protected listeners: Array<{
    type: string
    callback: (event: MessageEvent<unknown>) => void
  }> = []
  constructor(
    /**
     * The paired port in the {@link MessageChannel} to which this port belongs.
     * i.e. If the current port is {@link MessageChannel.port1 | port1}, {@link MessageChannel.port2 | port2} is the paired port and vice versa.
     */
    private pairedPort?: MockMessagePort,
    public portScope?: 'main-thread' | 'shared-worker-thread'
  ) {
    if (this.pairedPort) this.pairedPort.pairPort(this)
  }

  public start() {
    this.portStartCalled = true
  }

  /**
   * Assigns the given port as the paired port for the current port.
   */
  public pairPort(pairedPort: MockMessagePort): void {
    this.pairedPort = pairedPort
  }
  public addEventListener(
    type: string,
    listener: (message: unknown) => void,
    options?: Parameters<MessagePort['addEventListener']>[2]
  ): void {
    const listenerObj = { type, callback: listener as () => void }
    this.listeners.push(listenerObj)

    /**  Handling {@link AbortController} signal in options argument. */
    if (typeof options !== 'object' || !('signal' in options)) return
    const signal = options.signal
    const onAbort = () => {
      this.listeners = this.listeners.filter((l) => l !== listenerObj)
      signal.removeEventListener('abort', onAbort)
    }
    if (signal.aborted) {
      onAbort()
    } else {
      signal.addEventListener('abort', onAbort)
    }
  }

  public postMessage(message: unknown, options?: unknown): void {
    this.pairedPort?.emitMessage(message)
  }

  public onmessage: ((event: MessageEvent<unknown>) => void) | null = null

  /**
   * Invokes all the listening callbacks of the current port.
   */
  public emitMessage(message: unknown) {
    if (!this.portStartCalled) return
    /**
     * DOM uses {@link structuredClone} algorithm
     *  to serialize the messages transmitted using DOM MessageChannel.
     */
    message = structuredClone(message)
    const messageEvent: MessageEvent = {
      data: message,
      // data: message,
      source: {} as unknown as MessagePort,
      ports: [
        this as unknown as MessagePort,
        this.pairedPort as unknown as MessagePort,
      ],
    } satisfies Pick<
      MessageEvent,
      'data' | 'source' | 'ports'
    > as unknown as MessageEvent
    for (const listener of this.listeners) {
      if (listener.type !== 'message') return
      listener.callback(messageEvent)
    }
    if (this.onmessage) {
      this.onmessage(messageEvent)
    }
  }
}

/**
 * Message Port with emitMessage method.
 */
type MessagePortForTest = MessagePort & {
  emitMessage: (message: unknown) => void
}

/**
 * Mock for Message Channel.
 */
class MockMessageChannel implements MessageChannel {
  public port1: MessagePortForTest
  public port2: MessagePortForTest
  constructor() {
    const port1 = new MockMessagePort(undefined, 'main-thread')
    const port2 = new MockMessagePort(port1, 'shared-worker-thread')
    this.port1 = port1 as unknown as MessagePortForTest
    this.port2 = port2 as unknown as MessagePortForTest
  }
}

/**
 * Mock for Shared Worker.
 * [Warning]: This doesn't create different instances
 *    when different source filePaths or names are passed.
 *    Because of limitation in testing environment.
 *    The limitiations are overcome in Playwright browser testing.
 */
export const MockSharedWorker = vi.fn(
  class implements Pick<SharedWorker, 'port'> {
    public messageChannel = new MockMessageChannel()
    public port: MessagePort = this.messageChannel.port1

    /**
     * Whether it should throw error during initialization.
     * Used to stimulate SharedWorker registration errors for testing.
     */
    public static failRegistration: boolean = false

    /** To mock passing a custom WebSocket implementation. */
    public static webSocketImpl?: ClientOptions['webSocketImpl']

    constructor(
      filePath: ConstructorParameters<typeof SharedWorker>[0] = '',
      options: ConstructorParameters<typeof SharedWorker>[1],
      mockoptions?: {
        /**
         * To test shared workers built by users.
         * For example, they can use a custom graphql-ws implementation inside shared-worker.
         */
        useMessageEventListener?: boolean
      }
    ) {
      if (MockSharedWorker.failRegistration) {
        throw new Error('SharedWorker registration failed.')
      }

      const connectEvent: Pick<
        SharedWorkerGlobalScopeEventMap['connect'],
        'ports'
      > = {
        ports: [this.messageChannel.port2],
      }

      if (!mockoptions?.useMessageEventListener) {
        connectListener(
          connectEvent as SharedWorkerGlobalScopeEventMap['connect'],
          MockSharedWorker.webSocketImpl ?? undefined
        )
      }

      if (mockoptions?.useMessageEventListener) {
        this.messageChannel.port2.start()
        this.messageChannel.port2.addEventListener('message', (event) => {
          handleMessageEvent({
            event,
            port: this.messageChannel.port2,
            ...(MockSharedWorker.webSocketImpl
              ? {
                  createClientImpl: MockSharedWorker.webSocketImpl,
                }
              : {}),
          })
        })
      }
    }
  }
)
