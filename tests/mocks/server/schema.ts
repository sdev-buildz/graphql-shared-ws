import SchemaBuilder from '@pothos/core'

import { createPubSub, type PubSub } from 'graphql-yoga'
//
import type {
  MutableFieldType,
  MutationCountType,
  SubscribableFieldType,
} from '../../util/types'

/**
 * The graphql schema builder
 */
const builder = new SchemaBuilder({})

builder.queryType({
  description: 'The schema root for fetching data.',
})

builder.mutationType({
  description: `The schema root for mutating data`,
})

builder.subscriptionType({
  description: `The schema root for subscriptions`,
})

const mutableFieldPrefix: MutableFieldType = 'suffix_is_'
let mutableField: MutableFieldType = mutableFieldPrefix

builder.queryField('name', (t) =>
  t.string({
    resolve: () => {
      return 'random-name'
    },
  })
)

builder.queryField('description', (t) =>
  t.string({
    resolve: () => {
      return 'summarized-content'
    },
  })
)

builder.queryField('mutableField', (t) =>
  t.string({
    args: {
      prefix: t.arg.string(),
    },
    resolve: () => {
      return mutableField
    },
  })
)

const mutationCount: number = 0
builder.mutationField('mutateField', (t) =>
  t.string({
    args: {
      suffix: t.arg.string(),
    },
    resolve: (_, args) => {
      mutableField = mutableFieldPrefix + (args.suffix ?? '')
      return mutableField
    },
  })
)

builder.mutationField('mutateField2', (t) =>
  t.string({
    args: {
      suffix: t.arg.string(),
    },
    resolve: (_, args) => {
      const ephermalField = mutableFieldPrefix + (args.suffix ?? '')
      return ephermalField
    },
  })
)

builder.queryField('mutationCount', (t) =>
  t.string({
    resolve: () => {
      return `mutated_${mutationCount}_times` satisfies MutationCountType
    },
  })
)

let subscribableIterator = 0

/**
 * resets the {@link subscribableIterator}
 */
export const resetSubscribableIterator = () => {
  subscribableIterator = 0
}

const pubsub: PubSub<{
  iteratorField: ['iterating', SubscribableFieldType]
  subscribeForError: [string]
  emitter: [string]
}> = createPubSub()

builder.subscriptionField('subscribeEmitter', (t) =>
  t.string({
    subscribe: () => {
      return pubsub.subscribe('emitter')
    },
    resolve: (parent) => {
      return parent
    },
  })
)

builder.mutationField('emitString', (t) =>
  t.string({
    description: 'Emit a string to test subsctiptions',
    args: {
      value: t.arg.string({
        required: true,
      }),
    },
    resolve: (_parent, { value }) => {
      pubsub.publish('emitter', value)
      return value
    },
  })
)

builder.subscriptionField('subscribeIterator', (t) =>
  t.string({
    args: {
      suffix: t.arg.string(),
    },
    subscribe: () => {
      return pubsub.subscribe('iteratorField', 'iterating')
    },
    resolve: (parent) => {
      return parent
    },
  })
)

builder.queryField(`queryForError`, (t) =>
  t.string({
    resolve: () => {
      throw new Error('error')
    },
  })
)

builder.subscriptionField('subscribeForError', (t) =>
  t.string({
    subscribe: (_parent, _args, ctx) => {
      setTimeout(() => {
        pubsub.publish('subscribeForError', 'loremIpsum')
      }, 500)
      return pubsub.subscribe('subscribeForError')
    },

    resolve: (parent) => {
      throw new Error('error')
    },
  })
)

/**
 * Starts the server by setting the pubsub event emitter for subscription.
 */
export async function startServer() {
  setInterval(() => {
    pubsub.publish(
      'iteratorField',
      'iterating',
      `iterating_${subscribableIterator++}`
    )
  }, 1000)
}

/**
 * The graphql schema
 */
export const schema = builder.toSchema()
