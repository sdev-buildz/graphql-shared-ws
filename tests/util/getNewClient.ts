import {
  createSharedClient,
  type SharedClient,
  type SharedClientOptions,
} from '../../src'
import { webSocketsInWorker } from '../../src/for-worker-thread/core'
import { advanceByRealTime } from '../lib/captureRealTimeout'
import { waitForNextTick } from '../lib/waitForNextTick'

/**
 * Creates a new shared client and returns related variables.
 */
export const getNewClient = async (
  clientOptions: SharedClientOptions = {
    url: 'wss://example.com/api/graphql',
    lazy: false,
  }
): Promise<SharedClient> => {
  const client = createSharedClient(clientOptions)
  const coreClientCount = webSocketsInWorker.size
  await waitForNextTick()
  for (let i = 0; i < 5; i += 1) {
    await advanceByRealTime(5)
    if (webSocketsInWorker.size > coreClientCount) break
  }
  return client
}
