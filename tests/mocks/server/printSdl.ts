import { writeFileSync } from 'fs'
import type { GraphQLSchema } from 'graphql'
import { lexicographicSortSchema, printSchema } from 'graphql'

import path from 'path'
import { schema as e2eSchema } from '../../e2e/web-app/server/schema'
import { schema } from './schema'

/**
 *  Generates and writes the schema.graphql file for the given schema.
 */
export function printGraphqlSdl(server: ServerDetails) {
  const schemaAsString = printSchema(lexicographicSortSchema(server.schema))
  writeFileSync(server.path, schemaAsString)
}

type ServerDetails = {
  schema: GraphQLSchema
  path: string
}

const servers: ServerDetails[] = [
  {
    schema: schema,
    path: path.join(import.meta.dirname, `./schema.gen.graphql`),
  },
  {
    schema: e2eSchema,
    path: path.join(
      import.meta.dirname,
      `../../e2e/web-app/shared/schema.gen.graphql`
    ),
  },
]

for (const server of servers) {
  printGraphqlSdl(server)
}

process.exit(0)
