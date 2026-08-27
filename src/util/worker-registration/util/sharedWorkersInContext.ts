/**
 * Shared Worker registered or being registered in the browsing contex
 * It is used as a lock.
 *
 * Used to avoid race conditions which occur when multiple shared workers are registered concurrently.
 * The race conditions cause duplicate shared worker instances.
 */
export const sharedWorkerInContext: {
  worker: Promise<SharedWorker> | undefined
} = { worker: undefined }
