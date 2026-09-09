import { canonicalSerialization } from 'canonical-serialization'
import type { SharedWebSocket } from '../../SharedWebSocket'
import { sharedWorkerBase64 } from './tracked-generated/shared-worker-inline'
import { decompressGzipString } from './util/decompressGzipB64'
import { sharedWorkerInContext } from './util/sharedWorkersInContext'

/** Allows users to provide their own SharedWorker script. */
export const customSharedWorkerScript: {
  /**
   * URL of the custom SharedWorker script.
   * The bundled script is used when this is undefined.
   */
  url: string | undefined
} = {
  url: undefined,
}

/**
 * Prefix for the Local Storage key that stores a SharedWorker blob URL.
 *
 * The URL is created from the bundled script with {@link URL.createObjectURL}.
 * Sharing it through Local Storage avoids creating duplicate blob URLs across
 * browsing contexts.
 */
const lsWorkerUrlKeyPrefix: string = 'shared-worker-blob-url-'

/** Name used to identify the graphql-shared-ws SharedWorker. */
const sharedWorkerName = 'graphql-shared-ws'

/**
 * Returns the Local Storage key for the SharedWorker URL.
 */
const getLsKeyForWorkerUrl = (
  options: ConstructorParameters<typeof SharedWorker>[1]
) => {
  return `${lsWorkerUrlKeyPrefix}${canonicalSerialization(options)}`
}

/** Checks whether a blob URL is syntactically valid and accessible. */
const isBlobUrlValid = async (url: string | URL): Promise<boolean> => {
  try {
    // A URL can remain in Local Storage after its blob has been revoked.
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'blob:') {
      throw new Error('Invalid URL protocol. Expected blob:')
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Blob URL cannot be accessed.')
    }
    return true
  } catch (error) {
    console.error('Blob URL validation failed:', error)
    // Release the URL when it is no longer usable in this context.
    URL.revokeObjectURL(url.toString())
    return false
  }
}

/**
 * Registers a SharedWorker for {@link SharedWebSocket}.
 */
export const registerSharedWorker = async (): Promise<SharedWorker> => {
  const options = sharedWorkerName

  /** Reuse the worker registration already in progress or completed here. */
  if (sharedWorkerInContext.worker) return sharedWorkerInContext.worker

  const { promise: workerPromise, resolve: setSharedWorker } =
    Promise.withResolvers<SharedWorker>()

  // Keep concurrent callers in this browsing context on the same registration promise.
  sharedWorkerInContext.worker = workerPromise

  /** The registered shared worker */
  let sharedWorker: SharedWorker

  /** Reuse the bundled worker URL saved by another context, if valid. */
  const processLocalStorageUrl = async (): Promise<boolean> => {
    const urlFromStorage = localStorage?.getItem(getLsKeyForWorkerUrl(options))
    const isValid = urlFromStorage && (await isBlobUrlValid(urlFromStorage))
    if (!isValid) return false
    const sharedWorker = new SharedWorker(urlFromStorage, options)
    setSharedWorker(sharedWorker)
    return true
  }

  if (await processLocalStorageUrl()) return workerPromise
  else {
    const lockName = 'shared-worker-registration'
    await navigator.locks.request(lockName, async (lock) => {
      // Recheck after acquiring the cross-context lock; another context may
      // have stored a usable URL while this request was waiting.
      if (await processLocalStorageUrl()) return

      let workerUrl: string
      if (customSharedWorkerScript.url) {
        workerUrl = customSharedWorkerScript.url
        sharedWorker = new SharedWorker(workerUrl, options)
      } else {
        const workerScript = await decompressGzipString(sharedWorkerBase64)
        const blob = new Blob([workerScript])
        workerUrl = URL.createObjectURL(blob)
        await isBlobUrlValid(workerUrl)
        sharedWorker = new SharedWorker(workerUrl, options)
        localStorage.setItem(getLsKeyForWorkerUrl(options), workerUrl)
      }

      sharedWorker.port.start()
      setSharedWorker(sharedWorker)
    })
  }

  return workerPromise
}
