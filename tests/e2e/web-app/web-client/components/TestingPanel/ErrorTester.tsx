import type { Query } from '@types-gen-react-apollo'
import { canonicalSerialization } from 'canonical-serialization'
import type { GraphQLFormattedError } from 'graphql'
import { createSharedClient } from 'graphql-shared-ws'
import { useCallback, useState } from 'react'
import sharedConfig from '../../../shared/config'

const gqlClient = createSharedClient({
  url: sharedConfig.graphqlWssEndpoint,
})

/**
 * To test errors in graphql responses
 */
export const ErrorTest = () => {
  const [queryState, setQueryState] = useState<{
    lastResult?: {
      errors?: GraphQLFormattedError[] | undefined
      data?: Pick<Query, 'queriableField'> | null
      extensions?: unknown
    }
    // lastResult?: FormattedExecutionResult<
    //   Pick<Query, 'queriableField'>,
    //   unknown
    // >
    error?: unknown
    completed?: boolean
    unsubscribe?: () => void
  }>({})

  const fetch = useCallback(async () => {
    gqlClient.subscribe<Pick<Query, 'queriableField'>>(
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
        <dt>Error in response from server:</dt>
        <dd data-testid='error-tester-error-message'>
          {canonicalSerialization(queryState.lastResult?.errors?.[0]?.message, {
            keepCircularReferences: false,
          })}
        </dd>
      </dl>
      <button
        data-testid='refetch-query-for-error'
        type='button'
        onClick={() => fetch()}
      >
        Refetch Query for error
      </button>
    </section>
  )
}
