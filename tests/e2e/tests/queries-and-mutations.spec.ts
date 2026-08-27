import { test as base, expect } from '@playwright/test'
import { getLocators } from '../util/getLocators'
import { mockServersForTest } from '../util/setupMockServer'
import { initPageFixtures } from '../util/util'

const test = initPageFixtures(base)
test.describe('queries, and mutations', () => {
  mockServersForTest(test)
  test('query operations', async ({ page1, page2 }) => {
    const locators = getLocators({
      pages: { page1, page2 },
      locators: {
        value: 'queriable-field-value',
        query: 'refetch-queriable',
      },
    })

    const prevValue1: string = await locators.page1.value.innerText()
    const prevValue2 = await locators.page2.value.innerText()

    await test.step(`query operations should work.`, async () => {
      await locators.page1.query.click()

      await expect(locators.page1.value).not.toHaveText(prevValue1)
    })

    await test.step(`query results should be routed to only the querying browser tab.`, async () => {
      await expect(locators.page2.value).toHaveText(prevValue2)
    })
  })

  test('mutation operations', async ({ page1, page2 }) => {
    const locators = getLocators({
      pages: { page1, page2 },
      locators: {
        value: 'queried-mutable-field-value',
        input: 'mutation-input',
        mutate: 'mutate-mutable-field',
        query: 'refetch-mutable',
      },
    })

    const preValue = 'pre-value-1'
    await locators.page1.input.fill(preValue)
    await locators.page1.mutate.click()

    const randomValue1 = 'random-value-1'
    await expect(locators.page1.value).not.toHaveText(randomValue1)
    await expect(locators.page2.value).not.toHaveText(randomValue1)

    await test.step('mutation operations should work.', async () => {
      await locators.page1.input.fill(randomValue1)
      await locators.page1.mutate.click()

      await expect(locators.page1.value).toHaveText(randomValue1)
    })

    await test.step('mutation results are routed to only the mutating browser tab.', async () => {
      await expect(locators.page2.value).not.toHaveText(randomValue1)
    })
  })
})
