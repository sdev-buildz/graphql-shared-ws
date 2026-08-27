declare global {
  interface Window {
    /**
     * An unique id for each browser. This is injected by addInitScript.
     * Used to avoid collisions when running tests in parallel across browsers.
     */
    __PLAYWRIGHT_TEST_ID__: string
  }
}
export {}
