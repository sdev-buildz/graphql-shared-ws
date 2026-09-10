/**
 * Entry point for using `graphql-shared-ws` from a custom `SharedWorker`.
 *
 * The exports in this module handle SharedWorker connection and message events and
 * coordinate the WebSocket connections shared by the connected browsing
 * contexts. Most applications do not need to import this module because the
 * library registers its own SharedWorker automatically. Use it when providing a
 * custom SharedWorker script, for example to supply a custom WebSocket
 * implementation.
 * @example
 * ```ts
 * import { connectListener } from 'graphql-shared-ws/for-worker-thread'
 *
 * declare const globalThis: SharedWorkerGlobalScope
 *
 * globalThis.addEventListener('connect', connectListener)
 * ```
 * @packageDocumentation
 */

export * from './connectListener'
export * from './handler'
