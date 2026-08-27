import { beforeAll, beforeEach, vi } from 'vitest'
import { sharedWorkerInContext } from '../src'
import { webSocketsInWorker } from '../src/for-worker-thread/core'
import { MockSharedWorker } from '../tests/mocks/mock-worker-thread/mockSharedWorker'
import { MockWebSocket } from '../tests/mocks/mock-ws'
import { startServer } from '../tests/mocks/server'
import './lib/captureRealTimeout'

beforeAll(() => {
  vi.useFakeTimers()
  startServer()
})

beforeEach(() => {
  vi.clearAllMocks()
  sharedWorkerInContext.worker = undefined
  webSocketsInWorker.clear()
})

vi.stubGlobal('navigator', {
  locks: {
    request: async (
      name: string,
      arg1: LockGrantedCallback<unknown> | LockOptions,
      arg2?: LockGrantedCallback<unknown>
    ) => {
      // Handle overloaded request options: (name, callback) or (name, options, callback)
      const options = typeof arg1 === 'object' ? arg1 : {}
      const callback = typeof arg1 === 'function' ? arg1 : arg2

      if (!callback) {
        throw new TypeError('A callback function must be provided')
      }

      // Simulate lock acquisition and execute callback
      const fakeLock = { name, mode: options.mode || 'exclusive' }
      return await callback(fakeLock)
    },
    query: async () => ({ held: [], pending: [] }),
  },
})

vi.stubGlobal('SharedWorker', MockSharedWorker)
vi.stubGlobal('WebSocket', MockWebSocket)
