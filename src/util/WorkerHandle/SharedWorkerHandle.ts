import {
  shrWsMessageTypeGuard,
  type MessageToWorker,
  type SharedWsMessages,
  type SocketId,
} from '@shared/types'

import { canonicalSerialization } from 'canonical-serialization'
import { registerSharedWorker } from '../worker-registration'
import type {
  getSharedWorkerStateEmitter,
  InitialListeners,
} from './getSharedWorkerStateEmitter'
import type { StrictSharedWorker } from './StrictSharedWorker'
import { getNewFacadeId } from './util'

/**
 * Worker Handle type for both shared and service worker handles.
 */
export type WorkerHandleType = {
  /** Posts message to worker */
  postMessage: (message: MessageToWorker) => void
  /** Adds listener to 'message' events sent from worker */
  addMessageEventListener: (
    messageEventListener: (event: MessageEvent) => void,
    signal?: AbortController['signal']
  ) => void
}

/**
 * shared worker configuration.
 */
export type SharedWorkerOptions = {
  /**
   * To listen to shared worker registration events.
   */
  onSharedWorker?: InitialListeners
}

/**
 * To interact with shared worker.
 */
export class SharedWorkerHandleWs implements WorkerHandleType {
  private sharedWorker: StrictSharedWorker | undefined

  private facadeIdValue: string = ''
  protected abortController: AbortController = new AbortController()

  /**
   * Messages queued to be posted to shared worker.
   * They will be posted once facade id is assigned for this {@link SharedWorkerHandleWs}.
   */
  private messagesQueuedUntilId: MessageToWorker[] = []

  /**
   * To be added listeners for message events from shared worker port.
   * They will be posted once facade id is assigned for this {@link SharedWorkerHandleWs}.
   */
  private listenersQueuedUntilWorker: Parameters<
    typeof this.addMessageEventListener
  >[0][] = []

  constructor(
    public socketId: SocketId,
    private emitSharedWorkerState: ReturnType<
      typeof getSharedWorkerStateEmitter
    >['emit']
  ) {
    this.initWorker().then(() => {
      this.setupFacadeIdHandler()
    })
    this.initCoreClient()
  }

  get facadeId() {
    return this.facadeIdValue
  }

  /**
   * Creates (or uses provided) shared worker.
   */
  private async initWorker(): Promise<void> {
    /** Creating a new shared worker if user didn't provide one */
    this.emitSharedWorkerState('registering', [])
    try {
      this.sharedWorker = await registerSharedWorker()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.emitSharedWorkerState('registered', [this.sharedWorker as any])

      //  Registering the queued listeners
      for (const queuedListener of this.listenersQueuedUntilWorker) {
        this.addMessageEventListener(queuedListener)
      }
    } catch (err) {
      this.emitSharedWorkerState('error', [err])
    }
  }

  /** Creates (or skips if already exists) core graphql-ws client inside shared worker. */
  private initCoreClient() {
    const messageToPost: SharedWsMessages['toWorker']['init'] = {
      messageType: 'shr-ws-init',
      socketId: this.socketId,
      facadeId: this.facadeIdValue,
    }

    this.postMessage(messageToPost)
  }

  public postMessage(message: MessageToWorker) {
    if (!this.sharedWorker) {
      this.messagesQueuedUntilId.push(message)
      return
    }
    if (
      shrWsMessageTypeGuard<SharedWsMessages['toWorker']['getFacadeId']>(
        message,
        'shr-ws-get-facade-id'
      )
    ) {
      this.sharedWorker.port.postMessage(
        canonicalSerialization(message, { keepCircularReferences: false })
      )
      return
    }
    if (!this.facadeIdValue) return
    if (this.facadeIdValue && 'facadeId' in message)
      message.facadeId = this.facadeIdValue

    this.sharedWorker.port.postMessage(
      canonicalSerialization(message, { keepCircularReferences: false })
    )
    return
  }

  /** to listen to message events sent from shared worker. */
  public addMessageEventListener(
    messageEventListener: (event: MessageEvent) => void,
    signal?: AbortController['signal']
  ) {
    if (!this.sharedWorker) {
      this.listenersQueuedUntilWorker.push(messageEventListener)
      return
    }

    const port = this.sharedWorker.port
    port.addEventListener(
      'message',
      (event) => {
        messageEventListener(event)
      },
      {
        signal: AbortSignal.any(
          [signal, this.abortController.signal].filter(
            (signal) => signal !== undefined
          )
        ),
      }
    )
  }

  /** Notes down facade-id assigned by worker */
  private async setupFacadeIdHandler() {
    if (!this.sharedWorker) {
      return
    }
    this.sharedWorker.port.start()

    getNewFacadeId(
      this.socketId,
      this.addMessageEventListener.bind(this),
      this.postMessage.bind(this),
      this.messagesQueuedUntilId,
      (id: string) => {
        this.facadeIdValue = id
      }
    )
  }
}

export { SharedWorkerHandleWs as WorkerHandle }
