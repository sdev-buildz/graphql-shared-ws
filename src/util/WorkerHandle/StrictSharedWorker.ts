import type { StrictOmit } from 'ts-strict-utils'

class StrictMessagePort extends MessagePort {
  override addEventListener<K extends keyof MessagePortEventMap>(
    type: K,
    listener: (this: MessagePort, ev: MessagePortEventMap[K]) => unknown,
    options: StrictOmit<AddEventListenerOptions, 'signal'> &
      Required<Pick<AddEventListenerOptions, 'signal'>>
  ): void {
    return super.addEventListener(type, listener, options)
  }
}

/**
 * {@link globalThis.SharedWorker} with type safety to ensure that
 *  {@link AbortController.signal} is provided to every call to {@link MessagePort.addEventListener}.
 */
export type StrictSharedWorker = Omit<SharedWorker, 'port'> & {
  readonly port: StrictMessagePort
}
