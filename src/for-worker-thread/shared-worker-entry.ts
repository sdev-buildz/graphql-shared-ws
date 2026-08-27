import { connectListener } from './connectListener'

// eslint-disable-next-line no-shadow-restricted-names
declare const globalThis: SharedWorkerGlobalScope

globalThis.addEventListener('connect', connectListener)
