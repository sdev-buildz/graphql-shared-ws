import { defineConfig } from 'tsdown'

/**
 * The configuration object for the shared worker build
 */
export const config = {
  entry: {
    sharedWorker: 'src/for-worker-thread/shared-worker-entry.ts',
  },
  // Output both ES Modules and CommonJS formats
  format: ['iife'],
  dts: {
    build: false,
  },

  // Clean the dist directory before building
  clean: true,

  outDir: 'dist/shared-worker-string',
  deps: {
    alwaysBundle: ['**'],
    skipNodeModulesBundle: false,
  },
  treeshake: true,
  minify: true,
  tsconfig: false,
} satisfies Parameters<typeof defineConfig>[0]

export default defineConfig(config)
