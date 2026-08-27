import type { execute, subscribe } from 'graphql'
import { type ExecutionArgs } from 'graphql'
import { makeBehavior } from 'graphql-ws6/use/uWebSockets'
import { yoga } from './yogaServerInstance'

type EnvelopedExecutionArgs = ExecutionArgs & {
  rootValue: {
    execute: typeof execute
    subscribe: typeof subscribe
  }
}

/**
 * asd
 */
export const graphqlWsHandler = makeBehavior({
  execute: (args) => {
    return (args as EnvelopedExecutionArgs).rootValue.execute(args)
  },

  subscribe: (args) => {
    return (args as EnvelopedExecutionArgs).rootValue.subscribe(args)
  },
  onSubscribe: async (ctx, _id, params) => {
    const { schema, execute, subscribe, contextFactory, parse, validate } =
      yoga.getEnveloped(ctx)

    const args: EnvelopedExecutionArgs = {
      schema,
      operationName: params.operationName,
      document: parse(params.query),
      variableValues: params.variables,
      contextValue: await contextFactory(),
      rootValue: {
        execute,
        subscribe,
      },
    }

    const errors = validate(args.schema, args.document)
    if (errors.length) return errors
    return args
  },
})
