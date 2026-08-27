type SharedWorkerStateEventListeners = {
  registering: () => void
  registered: (sharedWorker: typeof SharedWorker) => void
  error: (error: unknown) => void
}
/**
 * Shared worker registration states
 */
export type SharedWorkerStateEvent = keyof SharedWorkerStateEventListeners

/**
 * Shared worker state event listeners
 */
export type SharedWorkerStateEventListener<
  Event extends SharedWorkerStateEvent = SharedWorkerStateEvent,
> = SharedWorkerStateEventListeners[Event]

/**
 * Initial listeners
 */
export type InitialListeners = {
  [Event in SharedWorkerStateEvent]?: SharedWorkerStateEventListener<Event>
}

/**
 * Get shared worker state emitter
 */
export const getSharedWorkerStateEmitter = () => {
  const listeners: Required<{
    [Key in SharedWorkerStateEvent]?: Array<SharedWorkerStateEventListener<Key>>
  }> = {
    registering: [],
    registered: [],
    error: [],
  }
  const addListener = <Event extends SharedWorkerStateEvent>(
    event: Event,
    listener: SharedWorkerStateEventListener<Event>
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listeners[event].push(listener as any)
  }
  const emit = <Event extends SharedWorkerStateEvent>(
    event: Event,
    args: Parameters<SharedWorkerStateEventListener<Event>>
  ) => {
    for (const listener of listeners[event]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(listener as any)(...args)
    }
  }

  return {
    addListener,
    emit,
  }
}
