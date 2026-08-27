import SchemaBuilder from '@pothos/core'
import type { User } from '../../lib/types'
import type { pubsub } from '../../util/pubsub'

/**
 *  The custom objects added to the context.
 */
export type CustomGraphqlContextType = {
  currentUser: User | undefined
  reqOrigin: string
  pubsub: typeof pubsub
}

/**
 * The Pothos GraphQL schema builder instance.
 */
export const builder = new SchemaBuilder<{
  Context: CustomGraphqlContextType
}>({})

builder.queryType({
  description: 'The schema root for fetching data.',
})

builder.mutationType({
  description: `The schema root for mutating data`,
})

builder.subscriptionType({
  description: `The schema root for subscriptions`,
})
