import { canonicalSerialization } from 'canonical-serialization'
import { sharedWorkerBase64 } from './generated/shared-worker-inline'
import { decompressGzipString } from './util/decompressGzipB64'
import { sharedWorkerInContext } from './util/sharedWorkersInContext'

/** To allow users to override the shared worker script. */
export const customSharedWorkerScript: {
  /**
   * The url of the user's custom shared worker script
   * If it is undefined, the default shared worker script will be used.
   */
  url: string | undefined
} = {
  url: undefined,
}

/**
 * Local Storage key storing Shared Worker object url created from {@link URL.createObjectURL}.
 *
 * To avoid duplicate shared-worker urls across browsing contexts.
 *
 * If shared worker is created from script inlined into a ts/js variable,
 *   a unique url is created using {@link URL.createObjectURL}.
 *  So this local storage entry is used to avoid duplicate urls.
 */
export const lsWorkerUrlKeyPrefix: string = 'shared-worker-blob-url-'

/** Name for the shared worker instance of graphql-shared-ws.  */
export const sharedWorkerName = 'graphql-shared-ws'

/**
 * Returns Local Storage key for the shared worker url corresponding to the given options.
 */
export const getLsKeyForWorkerUrl = (
  options: ConstructorParameters<typeof SharedWorker>[1]
) => {
  return `${lsWorkerUrlKeyPrefix}${canonicalSerialization(options)}`
}

/**
 * To test whether the blob url pointing to shared worker is valid and accessible.
 */
const isBlobUrlValid = async (url: string | URL): Promise<boolean> => {
  try {
    // Check if the URL is syntactically valid and a blob
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'blob:') {
      throw new Error('Invalid URL protocol. Expected blob:')
    }

    // Verify the URL is reachable/valid in the current context
    // const response = await fetch(parsedUrl)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Blob URL cannot be accessed.')
    }
    return true
  } catch (error) {
    console.error('url test error.:', error)
    // Revoke the blob URL to prevent memory leaks if registration fails
    return false
  }
}

/**
 * Registers a shared worker with the given configuration.
 */
export const registerSharedWorker = async (): Promise<SharedWorker> => {
  const options = sharedWorkerName

  /** an already created shared worker with the same configuration, in the same browsing context. */

  if (sharedWorkerInContext.worker) return sharedWorkerInContext.worker

  const { promise: workerPromise, resolve: setSharedWorker } =
    Promise.withResolvers<SharedWorker>()

  //  Caching the worker indexed by its configuration to avoid duplicate workers.
  sharedWorkerInContext.worker = workerPromise

  /** The registered shared worker */
  let sharedWorker: SharedWorker

  /**
   * Process the shared worker script url stored in local storage.
   * The url was created by {@link URL.createObjectURL} and stored in local storage.
   * @returns true if the url is still valid, false if it expired.
   */
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
      // The lock has been acquired.
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
      // Now the lock will be released.
    })
  }

  return workerPromise
}
