import type test from '@playwright/test'
import type { BrowserContext, Page } from '@playwright/test'

/**
 * Initializes Page fixtures.
 * Creates 2 pages under same {@link BrowserContext |  browser context } and navigates them both to https://localhost:3000.
 */
export const initPageFixtures = (
  base: typeof test,
  initScript?: () => void
) => {
  return base.extend<{ page1: Page; page2: Page }>({
    page1: async ({ context }, use) => {
      const page1 = await context.newPage()
      if (initScript) await page1.addInitScript(initScript)
      await page1.goto('https://localhost:3000')
      await page1.clock.install()
      await use(page1)
    },
    page2: async ({ context }, use) => {
      const page2 = await context.newPage()
      if (initScript) await page2.addInitScript(initScript)
      await page2.goto('https://localhost:3000')
      await page2.clock.install()
      await use(page2)
    },
  })
}
