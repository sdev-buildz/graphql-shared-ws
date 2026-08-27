import { defineConfig, devices } from '@playwright/test'
import sharedConfig from '@root/tests/e2e/web-app/shared/config'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e/tests',
  // testDir: './demo/e2e',/
  // testMatch: '**/*.spec.ts',
  // testMatch: '**/*.spec.ts',
  // testMatch: '**/persistance.spec.ts',
  outputDir: './tests/e2e/generated/e2e-test-results/',
  reporter: [
    [
      'html',
      { outputFolder: './tests/e2e/generated/test-reports', open: 'never' },
    ],
  ],
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : '50%',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    // Tells Playwright to bypass SSL/TLS certificate warnings
    ignoreHTTPSErrors: true,
    trace: 'on',
    baseURL: 'https://localhost:3000',
  },
  /* Running local dev server before starting the tests */
  webServer: [
    {
      command: 'pnpm run e2e:start-server',
      url: sharedConfig.origin,
      reuseExistingServer: !process.env.CI,
      ignoreHTTPSErrors: true,
      timeout: 15 * 1000,
    },
    {
      command: 'pnpm run e2e:start-react',
      url: 'https://localhost:3000',
      reuseExistingServer: !process.env.CI,
      ignoreHTTPSErrors: true,
    },
  ],

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--ignore-certificate-errors'],
        },
      },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    //   /**
    //    * Firefox takes more time setting up
    //    *  fixtures like BrowserContexts.
    //    */
    //   // timeout: 50 * 1000,
    //   timeout: 150 * 1000,
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    //   timeout: 50 * 1000,
    // },

    // /* Test against mobile browsers. */
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //     launchOptions: {
    //       args: ['--ignore-certificate-errors'],
    //     },
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    //   timeout: 50 * 1000,
    // },
    // // /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: {
    //     ...devices['Desktop Edge'],
    //     channel: 'msedge',
    //     launchOptions: {
    //       args: ['--ignore-certificate-errors'],
    //     },
    //   },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     channel: 'chrome',
    //     launchOptions: {
    //       args: ['--ignore-certificate-errors'],
    //     },
    //   },
    // },
  ],
})
