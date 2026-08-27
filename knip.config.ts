import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  ignoreFiles: [
    'src/util/worker-registration/util/shared-worker-inline-template.ts',
  ],
  typedoc: {
    config: ['./typedoc.{config,dev}.js'],
  },
  ignoreBinaries: ['pn'],
  ignoreDependencies: ['@changesets/cli'],
  workspaces: {
    'tests/e2e/web-app': {
      entry: ['./server/util/graphqlWsHandler.ts'],
      webpack: {
        config: ['./webpack/webpack.config.ts'],
      },
    },
  },
}

export default config
