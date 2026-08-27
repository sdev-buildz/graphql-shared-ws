declare module '*.css'

interface Window {
  __PLAYWRIGHT_TEST_ID__?: string // or any if you don't know the exact type
}
