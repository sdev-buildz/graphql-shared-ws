import type { Query } from '@types-gen-react-apollo'
import { SharedWebSocket } from 'graphql-shared-ws'
import { createClient } from 'graphql-ws'
import { useCallback, useState } from 'react'
import sharedConfig from '../../../shared/config'
import type { GqlQueryResult } from '../../util/types'

// const gqlClient = createSharedClient({
//   url: sharedConfig.graphqlWssEndpoint,
// })
const gqlClient = createClient({
  url: sharedConfig.graphqlWssEndpoint,
  webSocketImpl: SharedWebSocket,
})

/**
 * To test mutation type operations
 */
export const QueryTest = () => {
  const [queryState, setQueryState] = useState<GqlQueryResult>({})
  const fetch = useCallback(async () => {
    gqlClient.subscribe<Pick<Query, 'queriableField'>>(
      {
        query: `
      query queryTest {
        queriableField
      }
    `,
      },
      {
        next: (n) => {
          setQueryState((prev) => ({
            ...prev,
            lastResult: n.data?.queriableField ?? '',
          }))
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
    <section className='query-operation-tester'>
      {/* To test query type operations */}\<h4>To test query operations:</h4>
      <dl>
        <dt>Queriable Field:</dt>
        <dd data-testid='queriable-field-value'>{queryState.lastResult}</dd>
      </dl>
      <button
        data-testid='refetch-queriable'
        type='button'
        onClick={() => fetch()}
      >
        Refetch Queriable Field
      </button>
    </section>
  )
}
