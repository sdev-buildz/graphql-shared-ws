import { logger } from '@packages/logger'
import { createYoga } from 'graphql-yoga'
import { type GraphqlContextType } from '../lib/authenticate'
import { schema } from '../schema'
import { initGraphqlContext } from './initGraphqlContext'

/**
 * The GraphQL server instance.
 */
export const yoga = createYoga<GraphqlContextType>({
  schema: schema,
  context: (context) => {
    return initGraphqlContext(context)
  },
  graphiql: {
    subscriptionsProtocol: 'WS',
  },
  logging: {
    debug: (...args) => logger.debug(args),
    error: (...args) => {
      if (
        args[0]?.path?.[0] === 'queryForError' ||
        args[0]?.path?.[0] === 'subscribeForError'
      )
        return
      logger.error(args)
    },
    info: (...args) => logger.info(args),
    warn: (...args) => logger.warn(args),
  },
})
