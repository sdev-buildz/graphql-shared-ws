import {
  shrWsMessageTypeGuard,
  type MessageToWorker,
  type SharedWsMessages,
  type SocketId,
} from '@shared/types'
import type { WorkerHandleType } from './SharedWorkerHandle'

/**
 * Requests (and listens to) facade-id from the shared worker.
 */
export const getNewFacadeId = (
  socketId: SocketId,
  addMessageEventListener: WorkerHandleType['addMessageEventListener'],
  postMessage: WorkerHandleType['postMessage'],
  messagesQueuedUntilId: MessageToWorker[],
  setSubscriberId: (id: string) => void
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
    setSubscriberId(event.data.id)
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
