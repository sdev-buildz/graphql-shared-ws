import { logger } from '@packages/logger'
import { pubsub } from '../util/pubsub'
import { builder } from './lib/builder'

const randomStrings = ['a', 'b', 'c', 'd', 'e'] as const satisfies string[]
let idx = 0
builder.queryField('queriableField', (t) =>
  t.string({
    description: `Used to test query type operations. Returns a random string.`,

    resolve: () =>
      // randomStrings[Math.floor(Math.random() * randomStrings.length)],
      randomStrings[idx++ % randomStrings.length] + '_' + Date.now().toString(),
  })
)

let mutableField: string = 'sample value'
builder.mutationField('setMutableField', (t) =>
  t.string({
    description: `Sets the mutableField. Used to test mutation tpe operations.`,
    args: {
      value: t.arg.string({ required: true }),
    },
    resolve: (_parent, { value }) => {
      mutableField = value
      return value
    },
  })
)

builder.queryField('mutableField', (t) =>
  t.string({
    description: 'Returns the mutable field used to test the mutation result.',
    resolve: () => mutableField,
  })
)

const count = { value: 0 }
if (!process.env.PRINT_GRAPHQL_SDL) {
  setInterval(() => {
    count.value += 1
    pubsub.publish('testSubscription', count.value)
  }, 5000)
}

builder.subscriptionField('subscribableCount', (t) =>
  t.int({
    description: 'Used to test subscriptions.',
    subscribe: (_parent, _args, ctx) =>
      ctx.pubsub.subscribe('testSubscription'),
    resolve: () => count.value,
  })
)

builder.mutationField('emitString', (t) =>
  t.string({
    description: 'Emit a string to test subsctiptions',
    args: {
      value: t.arg.string({
        required: true,
        // validate: idPatternSchema,
      }),
    },
    resolve: (_parent, { value }) => {
      pubsub.publish('stringEmitter', value)
      return value
    },
  })
)

builder.subscriptionField('subscribeToEmittedString', (t) =>
  t.string({
    description: 'Used to test subscriptions.',
    args: {
      browserId: t.arg.string({ required: true }),
    },
    subscribe: (_parent, _args, ctx) => {
      return ctx.pubsub.subscribe('stringEmitter')
    },

    resolve: (parent) => {
      logger.warn('inside subscription event resolver. parent =' + parent)
      return parent
    },
  })
)

builder.subscriptionField('subscribeForError', (t) =>
  t.string({
    subscribe: (_parent, _args, ctx) => {
      setInterval(() => {
        ctx.pubsub.publish('subscribeForError', 'random')
      }, 500)
      return ctx.pubsub.subscribe('subscribeForError')
    },
    resolve: () => {
      throw new Error('error')
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
