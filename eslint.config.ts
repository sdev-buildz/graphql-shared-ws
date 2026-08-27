import prettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import {
  eslintJsConfig,
  eslintReactConfig,
  eslintTsConfig,
} from './eslint-ts-and-react.config'

export default defineConfig([
  // includeIgnoreFile(path.join(import.meta.dirname, '.gitignore')),
  {
    ignores: [
      '**/dist',
      '**/generated',
      'packages/migration/**/test-source-files',
    ],
  },

  eslintJsConfig,
  eslintTsConfig,
  eslintReactConfig,
  /**
   * Nodejs global variables.
   */
  [
    {
      files: [`**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}`],
      ignores: ['website/web-client/**'],
      languageOptions: {
        globals: {
          ...globals.nodeBuiltin,
        },
      },
    },
  ],
  prettier,
])
