import { customSharedWorkerScript } from '@graphql-shared-ws'
import { expect, it, onTestFinished, vi } from 'vitest'
import { MockSharedWorker } from './mocks/mock-worker-thread/mockSharedWorker'
import { MockWebSocket } from './mocks/mock-ws'
import { getNewClient } from './util/getNewClient'

it('supports custom SharedWorker URLs', async () => {
  const customScriptUrl = './workers/custom-shared-worker'

  customSharedWorkerScript.url = customScriptUrl
  onTestFinished(() => {
    customSharedWorkerScript.url = undefined
  })

  await getNewClient()

  expect(MockSharedWorker).toHaveBeenCalledTimes(1)
  expect(MockSharedWorker).toHaveBeenCalledWith(
    customScriptUrl,
    expect.anything()
  )
})

it('supports webSocketImpl inside SharedWorker.', async () => {
  const CustomWebSocketImpl = vi.fn(
    class {
      addEventListener = (): void => {}
    }
  )

  MockSharedWorker.webSocketImpl = CustomWebSocketImpl
  onTestFinished(() => {
    MockSharedWorker.webSocketImpl = undefined
  })

  await getNewClient()

  expect(CustomWebSocketImpl).toHaveBeenCalledOnce()
  expect(MockWebSocket).not.toHaveBeenCalled()
})
