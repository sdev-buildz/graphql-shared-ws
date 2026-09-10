import {
  shrWsMessageTypeGuard,
  type MessageToWorker,
  type SharedWsMessages,
  type SocketId,
} from '@shared'
import type { WorkerHandleType } from './SharedWorkerHandle'

/**
 * Requests (and listens to) facade-id from the shared worker.
 */
export const getNewFacadeId = (
  socketId: SocketId,
  /** Callback to listen to message events from the SharedWorker */
  addMessageEventListener: WorkerHandleType['addMessageEventListener'],
  /** Callback to post messages to the SharedWorker */
  postMessage: WorkerHandleType['postMessage'],
  /** Messages queued until facade-id is received */
  messagesQueuedUntilId: MessageToWorker[],
  /** Callback to set facade-id */
  setFacadeId: (id: string) => void
): void => {
  const subIdAbortController = new AbortController()

  addMessageEventListener((event) => {
    if (
      !shrWsMessageTypeGuard<SharedWsMessages['fromWorker']['facadeId']>(
        event.data,
        'shr-ws-facade-id'
      )
    )
      return
    setFacadeId(event.data.id)
    subIdAbortController.abort()
    messagesQueuedUntilId.forEach((message) => {
      postMessage(message)
    })
  }, subIdAbortController.signal)

  postMessage({
    messageType: 'shr-ws-get-facade-id',
    socketId: socketId,
  } satisfies SharedWsMessages['toWorker']['getFacadeId'])
}
