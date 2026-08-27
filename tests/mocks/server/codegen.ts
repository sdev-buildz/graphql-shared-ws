import type { CodegenConfig } from '@graphql-codegen/cli'
import path from 'node:path'
import { Project } from 'ts-morph'
import { typedObjectFromEntries } from 'ts-strict-utils'

const paths: Array<{ schema: string; target: string }> = [
  {
    schema: `${import.meta.dirname}/schema.gen.graphql`,
    target: `${import.meta.dirname}/generated/index.ts`,
  },
  {
    schema: path.join(
      import.meta.dirname,
      `/../../e2e/web-app/shared/schema.gen.graphql`
    ),
    target: path.join(
      import.meta.dirname,
      `/../../e2e/web-app/generated/typescript-react-apollo.tsx`
    ),
  },
]

/**
 *  Generates the types for the GraphQL client.
 */
export const codegenConfigForApollo: CodegenConfig['generates'][string] = {
  plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
  schema: `${import.meta.dirname}/schema.gen.graphql`,
  config: {
    withHooks: true,
    withResultType: true,
    withMutationFn: true,
  },
}

/**
 * Generates the types for the GraphQL client.
 * It parses the .graphql schema file and outputs the .ts file.
 */
const config: CodegenConfig = {
  overwrite: true,
  hooks: {
    afterAllFileWrite: [
      () => {
        /** Removing unused imports from the new generated file. To avoid tsc errors. */
        for (const pathValues of paths) {
          try {
            const project = new Project()
            project.addSourceFileAtPath(pathValues.target)

            const sourceFile = project.getSourceFile(pathValues.target)

            if (!sourceFile) {
              throw new Error(`File not found: ${pathValues.target}`)
            }
            sourceFile.organizeImports()
            project.saveSync()
          } catch (err) {
            console.error('err =', err)
          }
        }
      },
    ],
  },
  generates: {
    ...typedObjectFromEntries(
      paths.map((pathValues) => [
        pathValues.target,
        {
          plugins: [
            'typescript',
            'typescript-operations',
            'typescript-react-apollo',
          ],
          schema: pathValues.schema,
          config: {
            withHooks: true,
            withResultType: true,
            withMutationFn: true,
          },
        },
      ])
    ),
  },
}

export default config
