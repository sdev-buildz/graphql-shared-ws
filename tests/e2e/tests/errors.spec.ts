import { test as base, expect } from '@playwright/test'
import type { ClientOptions } from 'graphql-ws'
import { getLocators } from '../util/getLocators'
import { mockServersForTest } from '../util/setupMockServer'
import { initPageFixtures } from '../util/util'

const test = initPageFixtures(base)
test.describe('errors', () => {
  mockServersForTest(test)

  test('data.errors in observable.next callback.', async ({ page1, page2 }) => {
    const locators = getLocators({
      pages: { page1, page2 },
      locators: {
        value: 'error-tester-error-message',
        query: 'refetch-query-for-error',
      },
    })

    const prevValue1: string = await locators.page1.value.innerText()
    const prevValue2 = await locators.page2.value.innerText()

    await test.step(`server errors are sent through data.errors.`, async () => {
      await locators.page1.query.click()

      await expect(locators.page1.value).not.toHaveText(prevValue1)
      await expect(locators.page1.value).toContainText('Unexpected error')
    })

    await test.step(`server errors are sent to only the querying browsing context.`, async () => {
      await expect(locators.page2.value).toHaveText(prevValue2)
    })
  })

  test('connection errors.', async ({ page1, page2 }) => {
    const locators = getLocators({
      pages: { page1, page2 },
      locators: {
        value: 'conn-error-tester-data-errors',
        socketStateEvents: 'conn-error-tester-socket-state-events',
        query: 'refetch-query-invalid-url',
      },
    })

    const prevValue1: string =
      await locators.page1.socketStateEvents.innerText()

    let socketStateEvents: Partial<{
      error: Parameters<NonNullable<NonNullable<ClientOptions['on']>['error']>>
      closed: Parameters<
        NonNullable<NonNullable<ClientOptions['on']>['closed']>
      >
    }>

    await test.step(`connection errors are sent through ClientOptions.on.error callback.`, async () => {
      await locators.page1.query.click()

      await expect(locators.page1.socketStateEvents).not.toHaveText(prevValue1)
      await expect(locators.page1.socketStateEvents).toContainText('"error"')

      socketStateEvents = JSON.parse(
        await locators.page1.socketStateEvents.innerText()
      ) as typeof socketStateEvents
      expect(socketStateEvents).toHaveProperty('error')
    })

    await test.step(`close events are sent through ClientOptions.on.closed callback.`, async () => {
      expect(socketStateEvents).toHaveProperty('closed')
      expect(socketStateEvents.closed).toStrictEqual([
        { code: 1006, reason: '', wasClean: false },
      ])
    })
  })
})
