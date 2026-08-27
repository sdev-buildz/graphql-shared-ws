import type { Subscription } from '@types-gen-react-apollo'
import { createSharedClient, SharedWebSocket } from 'graphql-shared-ws'
import { createClient } from 'graphql-ws'
import { useCallback, useEffect, useRef, useState } from 'react'
import sharedConfig from '../../../shared/config'
import type { GqlQueryResult } from '../../util/types'

const gqlClient1 = createClient({
  url: sharedConfig.graphqlWssEndpoint,
  webSocketImpl: SharedWebSocket,
})
const gqlClient2 = createSharedClient({
  url: sharedConfig.graphqlWssEndpoint,
})

/**
 * To test query type operations
 */
export const TestConcurrentSubscriptions = ({
  multiSharedClients,
}: {
  testServiceWorker?: boolean
  multiSharedClients?: boolean
}) => {
  /**
   * An unique id to identify the browsing context.
   * When playwright runs tests in parallel across browsers,
   *  the emit and subscribe operations could be affected by race conditions
   *  because one server instance is shared across browsers.
   */
  const uniqueIdRef = useRef(`${window.__PLAYWRIGHT_TEST_ID__}-normal`)
  const [subscriptionState, setSubscriptionState] = useState<GqlQueryResult>({})
  const [subscriptionState2, setSubscriptionState2] = useState<GqlQueryResult>(
    {}
  )
  const [inputToEmit, setInputToEmit] = useState(`a random text`)

  useEffect(() => {
    const unsubscribe = gqlClient1.subscribe<
      Pick<Subscription, 'subscribeToEmittedString'>
    >(
      {
        query: `
      subscription subsciptionQuery($browserId: String!)  {
        subscribeToEmittedString(browserId: $browserId)
      }
    `,
        variables: {
          browserId: (window.__PLAYWRIGHT_TEST_ID__ ?? '') + '-normal',
        },
      },
      {
        next: (n) => {
          if (!n.data?.subscribeToEmittedString?.includes(uniqueIdRef.current))
            return
          setSubscriptionState((prev) => {
            return {
              ...prev,
              lastResult: n.data?.subscribeToEmittedString ?? '',
            }
          })
        },
        error: (err: unknown) => {
          setSubscriptionState((prev) => ({
            ...prev,
            error: err,
          }))
        },
        complete: () =>
          setSubscriptionState((prev) => ({
            ...prev,
            completed: true,
          })),
      }
    )
    const unsubscribe2 = gqlClient2.subscribe<
      Pick<Subscription, 'subscribableCount'>
    >(
      {
        query: `
      subscription subsciptionQuery {
        subscribableCount
      }
    `,
      },
      {
        next: (n) => {
          setSubscriptionState2((prev) => {
            return {
              ...prev,
              lastResult: n.data?.subscribableCount?.toString() ?? '',
            }
          })
        },
        error: (err: unknown) => {
          setSubscriptionState2((prev) => ({
            ...prev,
            error: err,
          }))
        },
        complete: () =>
          setSubscriptionState2((prev) => ({
            ...prev,
            completed: true,
          })),
      }
    )

    setSubscriptionState({
      ...subscriptionState,
      unsubscribe,
    })
    setSubscriptionState2({
      ...subscriptionState2,
      unsubscribe,
    })

    return () => {
      unsubscribe()
      unsubscribe2()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emitToSubscribers = useCallback(
    async ({ variables }: { variables: { value: string } }) => {
      gqlClient1.subscribe(
        {
          query: `
          mutation emitQuery($value: String!) {
            emitString(value: $value)
          }`,
          variables,
        },
        {
          next: (n) => {},
          error: (err: unknown) => {},
          complete: () => {},
        }
      )
    },
    []
  )

  return (
    <section className='subscription-operation'>
      <h4>Subscription Test</h4>
      {/* To test subscription type operations */}
      <dl>
        <dt>Subscribed Emitter. Last emitted:</dt>
        <dd data-testid={`last-emitted-value`}>
          {subscriptionState.lastResult}
        </dd>
        <dt>Subscribed Count. Last emitted:</dt>
        <dd data-testid={`different-subscription-last-value`}>
          {subscriptionState2.lastResult}
        </dd>
      </dl>

      <label htmlFor={`input-to-emit`}>Text to emit:</label>
      <input
        id={`input-to-emit`}
        data-testid={`input-to-emit`}
        type='text'
        value={inputToEmit}
        onChange={(e) => setInputToEmit(e.target.value)}
      />
      <button
        data-testid={`emit-to-subscribers`}
        type='button'
        onClick={() => {
          emitToSubscribers({
            variables: { value: `${inputToEmit}_id_${uniqueIdRef.current}` },
          })
        }}
      >
        Emit the text
      </button>
    </section>
  )
}
