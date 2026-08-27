import type { createSharedClient } from 'graphql-shared-ws'

/**
 * The result of a GraphQL query.
 * The last response is stored in `lastResult`.
 */
export type GqlQueryResult = {
  lastResult?: string
  error?: unknown
  completed?: boolean
  unsubscribe?: ReturnType<ReturnType<typeof createSharedClient>['subscribe']>
}
