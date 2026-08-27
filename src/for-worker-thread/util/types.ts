import type { MessageFromWorker } from '@shared/types'
import type { ClientOptions } from 'graphql-ws'
import type { handleMessageEvent } from '../'

/**
 * A facade WebSocket is the SharedWebSocket instance in main thread.
 *  The facade acts as a gateway to the actual WebSocket in worker.
 *
 * This handle provides interface to communicate with the facade.
 */
export type FacadeSocket = {
  /**
   * Uniquely identifies the facade.
   */
  id: string
  postMessage: (message: MessageFromWorker) => void
}

/**
 * @returns new {@link FacadeSocket}
 */
export const createFacade = (newFacade: {
  id: FacadeSocket['id']
  messagePort: MessagePort
}): FacadeSocket => ({
  id: newFacade.id,
  postMessage: (message) => newFacade.messagePort.postMessage(message),
})

/**
 * Modified {@link MessageEvent}.
 * {@link MessageEvent.ports} should be an array of length atleast 2.
 */
type MessageEventWithRequiredPort = Omit<
  Parameters<NonNullable<MessagePort['onmessage']>>[0],
  'ports'
> & {
  ports: [MessagePort, MessagePort | undefined]
}

/**
 * Events in shared workers.
 */
type SharedWorkerEvent = Pick<
  | Parameters<NonNullable<MessagePort['onmessage']>>[0]
  | MessageEventWithRequiredPort,
  'data' | 'ports'
>

/**
 * The parameter for {@link handleMessageEvent} function.
 */
export type EventParamType = {
  event: SharedWorkerEvent
  port: MessagePort
} & {
  webSocketImpl?: ClientOptions['webSocketImpl']
}
