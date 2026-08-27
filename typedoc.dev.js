import packageJson from './package.json' with { type: 'json' }

import config from './typedoc.config.js'

/** @type {Partial<import("typedoc").TypeDocOptions>} */
export default {
  ...config,
  name: `${packageJson?.name ?? 'graphql-shared-ws.'} - Internal Architecture (Developers)`,
  entryPointStrategy: 'expand',
  out: 'docs/generated/internal-architecture',
}
