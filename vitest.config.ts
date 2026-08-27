import { defaultExclude, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      include: ['src/**/*.{ts,tsx}', 'packages/*/src/**/*.{ts,tsx}'],
      exclude: [
        '**/generated',
        '**/shared-worker-inline-template.ts',
        '**/inlineSharedWorkerScript.ts',
        './packages/logger',
      ],
    },
    environment: 'jsdom',
    setupFiles: ['./tests/vitest.setup.ts'],
    exclude: [...defaultExclude, '**/e2e', '**/dist'],
    globals: true,
  },
  resolve: {
    tsconfigPaths: true,
  },
})
