/**
 * Promise for the SharedWorker registered or being registered in this browsing
 * context. Sharing it ensures concurrent callers reuse the same registration
 * instead of creating duplicate workers.
 */
export const sharedWorkerInContext: {
  worker: Promise<SharedWorker> | undefined
} = { worker: undefined }
