import type { Page, Route } from '@playwright/test'
import { graphql, type GraphQLSchema } from 'graphql'
import { schema } from '../web-app/server/schema'
import type { initPageFixtures } from './util'

interface GraphQLRequestBody<T = Record<string, unknown>> {
  operationName: string
  query: string
  variables: T
  extensions: unknown
}

/**
 * Fulfill with the response provided by the mock server.
 */
const fulfillUsingMockServer = async (route: Route) => {
  const request = route.request()
  const requestJson = request.postDataJSON() as GraphQLRequestBody
  const mockRes = await graphql({
    schema: schema as unknown as GraphQLSchema,
    source: requestJson.query,
    variableValues: requestJson.variables,
    operationName: requestJson.operationName,
  })
  await route.fulfill({
    status: 200,
    contentType: 'application/graphql-response+json; charset=utf-8',
    body: JSON.stringify(mockRes),
  })
}

/**
 * Setup mock server for the given {@link Page | page}.
 */
const mockServerForPage = async (page: Page) => {
  await page.route('**/graphql', fulfillUsingMockServer)
}

/**
 * Mocks the GraphQL API server for all page1 and page2 fixtures of the given test.
 */
export const mockServersForTest = (
  test: ReturnType<typeof initPageFixtures>
) => {
  test.beforeEach(async ({ page1, page2 }) => {
    await Promise.all([mockServerForPage(page1), mockServerForPage(page2)])
  })
}
