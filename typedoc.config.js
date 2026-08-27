import packageJson from './package.json' with { type: 'json' }

/** @type {Partial<import("typedoc").TypeDocOptions>} */
export default {
  name: `${packageJson?.name ?? 'graphql-shared-ws'} - API Reference (Users)`,
  entryPoints: ['src', 'src/for-worker-thread/index.ts'],
  out: 'docs/generated/api-reference',
  exclude: ['**/docs/**', '**/generated/**', '**/node_modules/**'],
  skipErrorChecking: true,
  markdownLinkExternal: true,
  // plugin: ['./my-typedoc-plugin.ts'],
  navigation: {
    includeCategories: true,
  },
  externalSymbolLinkMappings: {
    typescript: {
      SharedWorker:
        'https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker',
    },
    global: {
      SharedWorker:
        'https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker',
    },
    'graphql-ws': {
      '*': 'https://the-guild.dev/graphql/ws',
    },
  },
}
