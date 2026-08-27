import type { ClientOptions } from 'graphql-ws'
import { handleMessageEvent } from './handler'

/**
 * Listens to shared worker connect events and sets up handlers.
 * @example
 * ```ts
 * import { connectListener } from 'graphql-shared-ws/for-worker-thread'
 *
 * declare const globalThis: SharedWorkerGlobalScope
 *
 * globalThis.addEventListener('connect', connectListener)
 * ```
 */
export const connectListener = (
  event: SharedWorkerGlobalScopeEventMap['connect'],
  webSocketImpl?: ClientOptions['webSocketImpl']
): void => {
  const port = event.ports[0]!
  port.start()
  port.addEventListener('message', (event) => {
    handleMessageEvent({
      event,
      port: port,
      webSocketImpl,
    })
  })
}
