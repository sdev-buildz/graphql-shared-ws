import {
  createSharedClient,
  sharedWorkerInContext,
  type SharedClientOptions,
} from '@graphql-shared-ws'
import type { FormattedExecutionResult, OperationTypeNode } from 'graphql'
import type { ClientOptions } from 'graphql-ws'
import {
  GRAPHQL_TRANSPORT_WS_PROTOCOL,
  MessageType,
  type SubscribePayload,
} from 'graphql-ws'
import {
  afterAll,
  describe,
  expect,
  it,
  onTestFinished,
  test,
  vi,
  type Mock,
} from 'vitest'
import type {
  ExtractMessageTypeByType,
  GqlWsMsgTypes,
} from '../src/shared/graphql-ws-messages.types'
import { advanceByRealTime } from './lib/captureRealTimeout'
import { waitForNextTick } from './lib/waitForNextTick'
import { MockSharedWorker } from './mocks/mock-worker-thread/mockSharedWorker'
import { MockWebSocket } from './mocks/mock-ws'
import { newMockSink } from './mocks/newMockSink'
import { resetSubscribableIterator } from './mocks/server'
import type {
  Mutation,
  MutationMutateFieldArgs,
  Subscription,
} from './mocks/server/generated'
import { getCoreInfo } from './util/getCoreSocket'
import { getNewClient } from './util/getNewClient'
import type { MutableFieldType } from './util/types'

describe('initializations.', () => {
  it(`creates a graphql-ws client inside worker, when a shared-client is created`, async () => {
    const clientOptions: SharedClientOptions = {
      url: 'wss://example.com/api/graphql',
      lazy: false,
    }
    expect(MockWebSocket).not.toHaveBeenCalled()
    await getNewClient(clientOptions)

    expect(MockWebSocket).toHaveBeenCalledTimes(1)
    expect(MockWebSocket).toHaveBeenCalledWith(
      clientOptions.url,
      GRAPHQL_TRANSPORT_WS_PROTOCOL
    )
  })

  test(`facade-clients with same config share the same graphql-ws client.`, async () => {
    const clientOptions: SharedClientOptions = {
      url: 'wss://example.com/api/graphql',
      lazy: false,
    }
    expect(MockWebSocket).not.toHaveBeenCalled()

    await getNewClient(clientOptions)

    expect(MockWebSocket).toHaveBeenCalledTimes(1)
    expect(MockWebSocket).toHaveBeenCalledWith(
      clientOptions.url,
      GRAPHQL_TRANSPORT_WS_PROTOCOL
    )

    await getNewClient(clientOptions)

    expect(MockWebSocket).toHaveBeenCalledTimes(1)
  })

  test(`facade-clients with different config have different graphql-ws clients.`, async () => {
    const clientOptions1: SharedClientOptions = {
      url: 'wss://example.com/api/graphql',
      lazy: false,
    }
    const clientOptions2: SharedClientOptions = {
      url: 'wss://example-2.com/api/graphql',
      lazy: false,
    }
    expect(MockWebSocket).not.toHaveBeenCalled()

    await getNewClient(clientOptions1)

    expect(MockWebSocket).toHaveBeenCalledTimes(1)
    expect(MockWebSocket).toHaveBeenCalledWith(
      clientOptions1.url,
      GRAPHQL_TRANSPORT_WS_PROTOCOL
    )

    await getNewClient(clientOptions2)

    expect(MockWebSocket).toHaveBeenCalledTimes(2)
    expect(MockWebSocket).toHaveBeenCalledWith(
      clientOptions2.url,
      GRAPHQL_TRANSPORT_WS_PROTOCOL
    )
  })
})

describe('graphql operations.', () => {
  it('handles graphql query operations.', async () => {
    const client = await getNewClient()
    const sink = newMockSink()

    client.subscribe(
      {
        query: `
                query queryMutableField {
                  mutableField
                }
              `,
      },
      sink
    )
    await waitForNextTick()
    await advanceByRealTime(1000)
    expect(sink.next).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          mutableField: `suffix_is_` satisfies MutableFieldType,
        },
      })
    )
    expect(sink.complete).toHaveBeenCalledTimes(1)
  })

  it('handles graphql mutation operations.', async () => {
    const mutationPayload = {
      query: `
                mutation mutateMutableField($suffix: String) {
                  mutateField(suffix:$suffix)
                }
              `,
      extensions: {},
      operationName: 'mutateMutableField',
      variables: {
        suffix: 'test_suffix',
      } satisfies MutationMutateFieldArgs,
    } satisfies SubscribePayload

    const client = await getNewClient()
    const sink = newMockSink()

    client.subscribe(mutationPayload, sink)
    await waitForNextTick()

    expect(sink.next).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          mutateField:
            `suffix_is_${mutationPayload.variables.suffix}` satisfies MutableFieldType,
        },
      } satisfies FormattedExecutionResult<Pick<Mutation, 'mutateField'>>)
    )
    expect(sink.complete).toHaveBeenCalledTimes(1)
  })

  it('handles graphql subscription operations.', async () => {
    resetSubscribableIterator()

    const client1 = await getNewClient()

    const sink1 = newMockSink()

    client1.subscribe(
      {
        query: `subscription subscribeIteratorQuery { subscribeIterator }`,
      },
      sink1
    )

    await waitForNextTick()

    for (let i = 0; i < 2; i += 1) {
      await vi.advanceTimersByTimeAsync(1000)

      expect(sink1.next).toHaveBeenCalledTimes(i + 1)
      expect(sink1.next).toHaveBeenCalledWith({
        data: {
          subscribeIterator: `iterating_${i}`,
        } satisfies Pick<Subscription, 'subscribeIterator'>,
      } satisfies FormattedExecutionResult)
    }
  })

  it.each<{ operationName: OperationTypeNode }>([
    { operationName: 'query' },
    { operationName: 'mutation' },
    { operationName: 'subscription' },
  ])(
    `forwards graphql $operationName requests to only the corresponding WebSockets in SharedWorker.`,
    async (testParam) => {
      resetSubscribableIterator()

      const client1 = await getNewClient()
      const { coreSocket: coreSocket1 } = getCoreInfo()

      const client2 = await getNewClient({
        url: 'wss://example-2.com/api/graphql',
        lazy: false,
      })
      const { coreSocket: coreSocket2 } = getCoreInfo()

      await getNewClient({
        url: 'wss://example-3.com/api/graphql',
        lazy: false,
      })
      const { coreSocket: coreSocket3 } = getCoreInfo()

      const sink1 = newMockSink()
      const sink2 = newMockSink()

      vi.clearAllMocks()

      client2.subscribe(
        {
          query: `${testParam.operationName} subscribeIteratorQuery { subscribeIterator }`,
        },
        sink2
      )

      await waitForNextTick()

      expect(coreSocket2.webSocket.send).toHaveBeenCalledTimes(1)
      expect(coreSocket1.webSocket.send).not.toHaveBeenCalled()
      expect(coreSocket3.webSocket.send).not.toHaveBeenCalled()

      client1.subscribe(
        {
          query: `${testParam.operationName} subscribeIteratorQuery { subscribeIterator }`,
        },
        sink1
      )
      await waitForNextTick()

      expect(coreSocket2.webSocket.send).toHaveBeenCalledTimes(1)
      expect(coreSocket1.webSocket.send).toHaveBeenCalledTimes(1)
      expect(coreSocket3.webSocket.send).not.toHaveBeenCalled()
    }
  )
  it('forwards graphql query responses to only the corresponding observers.', async (testParam) => {
    const client1 = await getNewClient()
    const client2 = await getNewClient()

    const sinks = [
      newMockSink(),
      newMockSink(),
      newMockSink(),
      newMockSink(),
    ] as const

    const queryPayload1 = {
      query: `
                query query1 {
                  name
                }
              `,
    }
    const queryResponse1 = expect.objectContaining({
      data: {
        name: 'random-name',
      },
    })
    const queryPayload2 = {
      query: `
                query query2 {
                  description
                }
              `,
    }
    const queryResponse2 = expect.objectContaining({
      data: {
        description: 'summarized-content',
      },
    })
    client1.subscribe(queryPayload1, sinks[0])
    client1.subscribe(queryPayload2, sinks[1])
    client2.subscribe(queryPayload2, sinks[2])
    client2.subscribe(queryPayload1, sinks[3])

    await waitForNextTick()
    expect(sinks[0].next).toHaveBeenCalledWith(queryResponse1)
    expect(sinks[1].next).toHaveBeenCalledWith(queryResponse2)
    expect(sinks[2].next).toHaveBeenCalledWith(queryResponse2)
    expect(sinks[3].next).toHaveBeenCalledWith(queryResponse1)
    for (const sink of sinks) {
      expect(sink.complete).toHaveBeenCalledTimes(1)
    }
  })

  it('forwards graphql mutation responses to only the corresponding observers.', async (testParam) => {
    const client1 = await getNewClient()
    const client2 = await getNewClient()

    const sinks = [
      newMockSink(),
      newMockSink(),
      newMockSink(),
      newMockSink(),
    ] as const
    const queryPayload1: SubscribePayload = {
      query: `
                mutation query1($suffix: String) {
                  mutateField(suffix: $suffix)
                }
              `,
      variables: {
        suffix: 'test_suffix',
      },
    }
    const queryResponse1 = expect.objectContaining({
      data: {
        mutateField: 'suffix_is_test_suffix',
      },
    })
    const queryPayload2 = {
      query: `
                mutation query1($suffix: String) {
                  mutateField2(suffix: $suffix)
                }
              `,
      variables: {
        suffix: 'suffix_2',
      },
    }
    const queryResponse2 = expect.objectContaining({
      data: {
        mutateField2: 'suffix_is_suffix_2',
      },
    })
    client1.subscribe(queryPayload1, sinks[0])
    client1.subscribe(queryPayload2, sinks[1])
    client2.subscribe(queryPayload2, sinks[2])
    client2.subscribe(queryPayload1, sinks[3])

    await waitForNextTick()

    expect(sinks[0].next).toHaveBeenCalledWith(queryResponse1)
    expect(sinks[1].next).toHaveBeenCalledWith(queryResponse2)
    expect(sinks[2].next).toHaveBeenCalledWith(queryResponse2)
    expect(sinks[3].next).toHaveBeenCalledWith(queryResponse1)
    for (const sink of sinks) {
      expect(sink.complete).toHaveBeenCalledTimes(1)
    }
  })

  it('forwards graphql subscription responses to only the corresponding observers.', async () => {
    resetSubscribableIterator()

    const client = await getNewClient()
    const client2 = await getNewClient()

    const sink1 = newMockSink()
    const sink2 = newMockSink()
    const sink3 = newMockSink()
    const sink4 = newMockSink()

    client.subscribe(
      {
        query: `subscription subscribeIteratorQuery { subscribeIterator }`,
      },
      sink1
    )
    client.subscribe(
      {
        query: `subscription subscribeEmittableString { subscribeEmitter }`,
      },
      sink2
    )
    client2.subscribe(
      {
        query: `subscription subscribeEmittableString { subscribeEmitter }`,
      },
      sink3
    )
    client2.subscribe(
      {
        query: `subscription subscribeIteratorQuery { subscribeIterator }`,
      },
      sink4
    )

    for (let i = 0; i < 2; i += 1) {
      await vi.advanceTimersByTimeAsync(1000)

      expect(sink1.next).toHaveBeenCalledTimes(i + 1)
      expect(sink1.next).toHaveBeenCalledWith({
        data: {
          subscribeIterator: `iterating_${i}`,
        } satisfies Pick<Subscription, 'subscribeIterator'>,
      } satisfies FormattedExecutionResult)

      expect(sink4.next).toHaveBeenCalledTimes(i + 1)
      expect(sink4.next).toHaveBeenCalledWith({
        data: {
          subscribeIterator: `iterating_${i}`,
        } satisfies Pick<Subscription, 'subscribeIterator'>,
      } satisfies FormattedExecutionResult)

      expect(sink2.next).not.toHaveBeenCalled()
      expect(sink3.next).not.toHaveBeenCalled()
    }
  })

  it('unsubscribes.', async () => {
    const sink = newMockSink()
    const client = await getNewClient()
    const payload: SubscribePayload = {
      query: `subscription subscribeIteratorQuery { subscribeIterator }`,
    }

    const resolve = client.subscribe(payload, sink)
    await waitForNextTick()

    const { coreSocket, channelId } = getCoreInfo(payload)

    resolve()
    expect(coreSocket.webSocket.send).toHaveBeenLastCalledWith(
      JSON.stringify({
        type: MessageType.Complete,
        id: channelId,
      } satisfies GqlWsMsgTypes)
    )
  })

  it('unsubscribes only the specific subscription.', async () => {
    const client = await getNewClient()

    const sink1 = newMockSink()
    const sink2 = newMockSink()
    const sink3 = newMockSink()

    const payload1 = {
      query: `subscription query1 { subscribeIterator }`,
    }
    client.subscribe(payload1, sink1)
    await waitForNextTick()
    const { coreSocket } = getCoreInfo(payload1)

    const payload2 = {
      query: `subscription query2 { subscribeIterator }`,
    }
    const resolve2 = client.subscribe(payload2, sink2)
    await waitForNextTick()
    const { channelId } = getCoreInfo(payload2)

    const payload3 = {
      query: `subscription query3 { subscribeIterator }`,
    }

    client.subscribe(payload3, sink3)
    await waitForNextTick()

    vi.clearAllMocks()
    resolve2()
    await waitForNextTick()

    expect(coreSocket.webSocket.send).toHaveBeenCalledTimes(1)

    expect(coreSocket.webSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: MessageType.Complete,
        id: channelId,
      } satisfies GqlWsMsgTypes)
    )
  })

  it('unsubscribes only when all the subscribers have unsubscribed.', async () => {
    resetSubscribableIterator()

    const client = await getNewClient()

    const payload = {
      query: `subscription subscribeIteratorQuery { subscribeIterator }`,
    }

    const sink1 = newMockSink()
    const sink2 = newMockSink()
    const sink3 = newMockSink()

    const unsubscribe1 = client.subscribe(payload, sink1)
    const unsubscribe2 = client.subscribe(payload, sink2)
    const unsubscribe3 = client.subscribe(payload, sink3)

    await waitForNextTick()
    const { coreSocket, channelId } = getCoreInfo(payload)

    /** Expects that {@link MessageType.Complete} message for the subscription channel has not been sent to the server. */
    const expectCompleteOrNot = () => {
      for (const call of (coreSocket.webSocket.send as Mock).mock.calls) {
        const obj = JSON.parse(call[0]) as GqlWsMsgTypes
        expect(obj).not.toBe(
          expect.objectContaining({ type: MessageType.Complete } satisfies Pick<
            GqlWsMsgTypes,
            'type'
          >)
        )
      }
    }

    await vi.advanceTimersByTimeAsync(1000)
    expect(sink1.next).toHaveBeenCalledTimes(1)
    expect(sink2.next).toHaveBeenCalledTimes(1)
    expect(sink3.next).toHaveBeenCalledTimes(1)
    expectCompleteOrNot()

    unsubscribe1()
    unsubscribe2()

    await vi.advanceTimersByTimeAsync(1000)
    expect(sink1.next).toHaveBeenCalledTimes(1)
    expect(sink2.next).toHaveBeenCalledTimes(1)
    expect(sink3.next).toHaveBeenCalledTimes(2)
    expectCompleteOrNot()

    unsubscribe3()

    await vi.advanceTimersByTimeAsync(1000)
    expect(sink1.next).toHaveBeenCalledTimes(1)
    expect(sink2.next).toHaveBeenCalledTimes(1)
    expect(sink3.next).toHaveBeenCalledTimes(2)

    const lastCall = (
      coreSocket.webSocket.send as Mock<WebSocket['send']>
    ).mock.calls.at(-1)

    const lastCallObj = JSON.parse(
      lastCall as unknown as string
    ) as GqlWsMsgTypes

    expect(lastCallObj).toStrictEqual({
      type: MessageType.Complete,
      id: channelId,
    } satisfies ExtractMessageTypeByType<MessageType.Complete>)
  })

  it('passes data.errors to observer.next.', async () => {
    const sink = newMockSink()
    const client = await getNewClient()

    client.subscribe(
      {
        query: `
                query testingError {
                  queryForError
                }
              `,
      },
      sink
    )

    await waitForNextTick()

    expect(sink.next).toHaveBeenCalledWith({
      data: {
        queryForError: null,
      },
      errors: [
        {
          locations: [
            {
              column: 19,
              line: 3,
            },
          ],
          message: 'error',
          path: ['queryForError'],
        },
      ],
    })
  })
})

it('restarts subscriptions without affecting subscription channels in other browsing contexts.', async () => {
  resetSubscribableIterator()
  const sink = newMockSink()

  const client = await getNewClient()

  const payload: SubscribePayload = {
    query: `subscription subscribeIteratorQuery { subscribeIterator }`,
  }
  client.subscribe(payload, sink)

  let i = 0
  for (; i < 2; i += 1) {
    await vi.advanceTimersByTimeAsync(1000)

    expect(sink.next).toHaveBeenCalledTimes(i + 1)
    expect(sink.next).toHaveBeenCalledWith({
      data: {
        subscribeIterator: `iterating_${i}`,
      } satisfies Pick<Subscription, 'subscribeIterator'>,
    } satisfies FormattedExecutionResult)
  }

  const { coreSocket, channelId } = getCoreInfo(payload)

  const coreSendSpy = coreSocket.webSocket.send

  client.restartSubscription(payload)
  await waitForNextTick()
  expect(coreSendSpy).toHaveBeenCalledWith(
    JSON.stringify({
      type: MessageType.Complete,
      id: channelId,
    } satisfies GqlWsMsgTypes)
  )
  expect(coreSendSpy).toHaveBeenCalledWith(
    JSON.stringify({
      type: MessageType.Subscribe,
      id: channelId,
      payload,
    } satisfies GqlWsMsgTypes)
  )

  for (; i < 4; i += 1) {
    await vi.advanceTimersByTimeAsync(1000)

    expect(sink.next).toHaveBeenCalledTimes(i + 1)
    expect(sink.next).toHaveBeenCalledWith({
      data: {
        subscribeIterator: `iterating_${i}`,
      } satisfies Pick<Subscription, 'subscribeIterator'>,
    } satisfies FormattedExecutionResult)
  }
})

describe('Web Socket.', () => {
  it('passes errors to sink.error on lazy connection errors.', async () => {
    const client = await getNewClient({
      url: 'wss://invalid-example.com/',
      lazy: true,
    })

    const sink = newMockSink()
    client.subscribe(
      {
        query: `
          query testingError {
            queryForError
            }
              `,
      },
      sink
    )
    await waitForNextTick()
    await advanceByRealTime(10)
    expect(sink.error).toHaveBeenCalled()
  })

  it('calls onNonLazyError on connection errors when lazy is false.', async () => {
    const onNonLazyError = vi.fn()

    await getNewClient({
      url: 'wss://invalid-example.com/',
      lazy: false,
      onNonLazyError,
    })

    expect(onNonLazyError).toHaveBeenCalled()
  })

  it('closes the WebSocket connection only after all the associated facades are closed.', async () => {
    const client1 = await getNewClient()
    const { coreSocket } = getCoreInfo()

    const client2 = await getNewClient()
    const client3 = await getNewClient()

    client1.subscribe(
      {
        query: `subscription subscribeIteratorQuery { subscribeIterator }`,
      },
      newMockSink()
    )
    await waitForNextTick()

    expect(coreSocket.webSocket.readyState).toBe(WebSocket.OPEN)

    client1.dispose()
    client2.dispose()
    expect(coreSocket.webSocket.readyState).toBe(WebSocket.OPEN)

    client3.dispose()
    await waitForNextTick()
    expect(coreSocket.webSocket.readyState).toBe(WebSocket.CLOSED)
  })
})

describe('shared worker', () => {
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => {})

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  it('passes SharedWorker registration errors to SharedWebSocket.onerror.', async () => {
    MockSharedWorker.failRegistration = true
    onTestFinished(() => {
      MockSharedWorker.failRegistration = false
    })

    const client = createSharedClient({
      url: 'wss://example.com/api/graphql',
    })
    const sink = newMockSink()

    client.subscribe(
      {
        query: 'query { name }',
      },
      sink
    )

    await advanceByRealTime(5)

    /**
     * Since {@link ClientOptions.lazy} option is true, the error is caught in sink.error.
     * If it was false, the error would have been passed to {@link ClientOptions.onNonLazyError}.
     */
    expect(sink.error).toHaveBeenCalledTimes(1)
  })

  it('creates shared worker with same url if the previous url is still valid.', async () => {
    await getNewClient()
    const [scriptUrl, options] = MockSharedWorker.mock.calls[0]!

    vi.clearAllMocks()
    sharedWorkerInContext.worker = undefined
    await getNewClient()
    expect(MockSharedWorker).toHaveBeenCalledTimes(1)
    expect(MockSharedWorker).toHaveBeenCalledWith(scriptUrl, options)
  })

  it('creates shared worker with different url if previous url is expired.', async () => {
    await getNewClient()
    const [scriptUrl, options] = MockSharedWorker.mock.calls[0]!

    vi.clearAllMocks()
    sharedWorkerInContext.worker = undefined
    URL.revokeObjectURL(scriptUrl!.toString())

    await getNewClient()
    expect(MockSharedWorker).toHaveBeenCalledTimes(1)
    expect(MockSharedWorker).not.toHaveBeenCalledWith(scriptUrl, options)
    expect(MockSharedWorker).toHaveBeenCalledWith(expect.anything(), options)
  })
})
