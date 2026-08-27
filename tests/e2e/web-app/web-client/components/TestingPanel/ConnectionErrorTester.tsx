import type { Query } from '@types-gen-react-apollo'
import { canonicalSerialization } from 'canonical-serialization'
import type { GraphQLFormattedError } from 'graphql'
import { createSharedClient } from 'graphql-shared-ws'
import type { ClientOptions } from 'graphql-ws'
import { useCallback, useRef, useState } from 'react'

/**
 * To test errors in graphql responses
 */
export const ConnectionErrorTester = () => {
  const [queryState, setQueryState] = useState<{
    lastResult?: {
      errors?: GraphQLFormattedError[] | undefined
      data?: Pick<Query, 'queriableField'> | null
      extensions?: unknown
    }
    error?: unknown
    completed?: boolean
    unsubscribe?: () => void
  }>({})
  const [socketEvents, setSocketEvents] = useState<
    Partial<{
      error: Parameters<NonNullable<NonNullable<ClientOptions['on']>['error']>>
      closed: Parameters<
        NonNullable<NonNullable<ClientOptions['on']>['closed']>
      >
    }>
  >({})

  const gqlClientRef = useRef(
    createSharedClient({
      url: 'wss://localhost:443/invalid-url/api/graphql',
      on: {
        closed: (...args) => {
          setSocketEvents((prev) => ({
            ...prev,
            closed: args,
          }))
        },
        error: (...args) => {
          setSocketEvents((prev) => ({
            ...prev,
            error: args,
          }))
        },
      },
    })
  )

  const fetch = useCallback(async () => {
    gqlClientRef.current.subscribe<Pick<Query, 'queriableField'>>(
      {
        query: `
      query errorTesting {
        queryForError
      }
    `,
      },
      {
        next: (n) => {
          setQueryState(
            (prev) =>
              ({
                ...prev,
                lastResult: n,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              }) as any
          )
        },
        error: (err: unknown) => {
          setQueryState((prev) => ({
            ...prev,
            error: err,
          }))
        },
        complete: () => {
          setQueryState((prev) => ({
            ...prev,
            completed: true,
          }))
        },
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryState])

  return (
    <section>
      {/* To test query type operations */}
      <h4>To test the error field in graphql reponses:</h4>
      <dl>
        <dt>Response from server:</dt>
        <dd data-testid='conn-error-tester-data-errors'>
          {canonicalSerialization(queryState.lastResult?.errors?.[0]?.message, {
            keepCircularReferences: false,
          })}
        </dd>
        <dt>Error in sink.error response from server:</dt>
        <dd data-testid='conn-error-tester-sink-error'>
          {JSON.stringify(queryState.error)}
        </dd>
        <dt>socket state events:</dt>
        <dd data-testid='conn-error-tester-socket-state-events'>
          {JSON.stringify(socketEvents)}
        </dd>
      </dl>
      <button
        data-testid='refetch-query-invalid-url'
        type='button'
        onClick={() => fetch()}
      >
        Refetch Query for error
      </button>
    </section>
  )
}
