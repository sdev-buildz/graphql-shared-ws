import { defineConfig } from 'tsdown'

export default defineConfig({
  // Specify your library entry point
  entry: {
    index: 'src/index.ts',
    // 'sync-state-cli': 'src/cli',
    'for-worker-thread': 'src/for-worker-thread/index.ts',
  },
  // Output both ES Modules and CommonJS formats
  format: ['esm', 'cjs'],
  outDir: 'dist/main',
  dts: {
    build: false,
  },

  // Clean the dist directory before building
  clean: true,

  // tsconfig: 'tsconfig.build.json',

  // Optional: Generate source maps for debugging
  sourcemap: true,
  treeshake: true,
  minify: true,
  tsconfig: false,
})
