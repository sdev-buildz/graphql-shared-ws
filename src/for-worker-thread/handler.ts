import { isShrWsMessage, type SharedWsMessages } from '@shared/types'
import type { ClientOptions } from 'graphql-ws'
import { getFacade } from './core'
import { webSocketsInWorker } from './core/state'
import type { EventParamType, FacadeSocket } from './util/types'

/**
 * Handles message events sent to worker.
 * @example
 * ```ts
 * import { handleMessageEvent } from 'graphql-shared-ws/for-worker-thread'
 *
 * messagePort.onmessage = (event) => {
 *  handleMessageEvent({
 *    event,
 *    port: port,
 *  })
 * }}
 * ```
 */
export const handleMessageEvent = (eventParam: EventParamType): void => {
  if (typeof eventParam.event.data === 'string') {
    eventParam.event = {
      ...eventParam.event,
      data: (0, eval)(eventParam.event.data),
    }
  }
  if (!isShrWsMessage(eventParam.event.data)) return

  const subscriberHandle = getFacade(eventParam)
  if (!subscriberHandle) return
  handleMessage(
    eventParam.event.data,
    subscriberHandle,
    eventParam.webSocketImpl
  )
}

/**
 * Handles messages sent to worker.
 * @see {@link handleMessageEvent} - for example usage
 */
export const handleMessage = (
  message: unknown,
  facade: FacadeSocket,
  webSocketImpl?: ClientOptions['webSocketImpl']
): void => {
  if (!isShrWsMessage(message)) return
  type MessagesToWorker = SharedWsMessages['toWorker']
  switch (message.messageType) {
    case 'shr-ws-init' satisfies MessagesToWorker['init']['messageType']:
      webSocketsInWorker.create(message.socketId, facade, webSocketImpl)
      break
    case 'shr-ws-send' satisfies MessagesToWorker['send']['messageType']:
      webSocketsInWorker.get(message.socketId)?.send(message.data, facade)
      break
    case 'shr-ws-close' satisfies MessagesToWorker['close']['messageType']:
      webSocketsInWorker.get(message.socketId)?.close(message.args, facade)
      break
  }
}
