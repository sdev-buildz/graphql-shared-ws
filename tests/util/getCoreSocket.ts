import type { SubscribePayload } from 'graphql-ws'
import type { CoreWebSocket } from '../../src/for-worker-thread/core'
import { webSocketsInWorker } from '../../src/for-worker-thread/core'

/**
 * @returns the last created core WebSocket.
 */
export const getCoreInfo = <T extends SubscribePayload | undefined>(
  payload?: T
): {
  coreSocket: CoreWebSocket
  channelId: T extends SubscribePayload ? string : undefined
} => {
  const coreSocket = webSocketsInWorker.get(
    Array.from(webSocketsInWorker.keys()).at(-1)!
  )!

  const channelId = payload
    ? coreSocket.inflightSubscriptions.get(payload)!.channelId!
    : undefined

  return { coreSocket, channelId } as {
    coreSocket: CoreWebSocket
    channelId: T extends SubscribePayload ? string : undefined
  }
}
