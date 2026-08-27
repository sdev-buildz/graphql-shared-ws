import type { Locator, Page } from '@playwright/test'
import { typedObjectEntries, typedObjectFromEntries } from 'ts-strict-utils'

/**
 * Retrieves the locators for multiple pages and test ids.
 */
export const getLocators = <
  PageNameType extends string,
  LocNameType extends string,
>(props: {
  /**
   * Locators will be retrieved for each of these pages.
   */
  pages: Record<PageNameType, Page>
  /**
   * The test ids of the locators.
   */
  locators: {
    [key in LocNameType]: string
  }
}): {
  [pageName in PageNameType]: {
    [locatorName in LocNameType]: Locator
  }
} => {
  const locators = typedObjectFromEntries(
    typedObjectEntries(props.pages).map(([pageName, page]) => {
      return [
        pageName,
        typedObjectFromEntries(
          typedObjectEntries(props.locators).map(([locatorName, testId]) => {
            return [locatorName, page.getByTestId(testId)]
          })
        ),
      ]
    })
  )
  return locators
}
