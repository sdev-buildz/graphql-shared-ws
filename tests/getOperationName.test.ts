import { expect, it } from 'vitest'
import { extractOperationName } from '../src/shared/getNormalizedPayload'

it('should return the operation name from the graphql query string', () => {
  const query1 = `
    query testQuery {
      field1
    }
  `
  expect(extractOperationName(query1)).toBe('testQuery')

  const query2 = `
    subscription testSubscription {
      field1
    }
  `
  expect(extractOperationName(query2)).toBe('testSubscription')

  const query3 = `
    mutation testMutation {
      field1
    }
  `
  expect(extractOperationName(query3)).toBe('testMutation')

  const query4 = `
    query {
      field1
    }
  `
  expect(extractOperationName(query4)).toBeUndefined()

  const query5 = `
    subscription {
      field1
    }
  `
  expect(extractOperationName(query5)).toBeUndefined()

  const query6 = `
    mutation {
      field1
    }
  `
  expect(extractOperationName(query6)).toBeUndefined()
})

it('should return the operation name from graphql query strings with variable parameters', () => {
  const query1 = `
    query testQuery($suffix: String) {
      field1(suffix: $suffix)
    }
  `
  expect(extractOperationName(query1)).toBe('testQuery')

  const query2 = `
    subscription testSubscription($suffix: String) {
      field1(suffix: $suffix)
    }
  `
  expect(extractOperationName(query2)).toBe('testSubscription')

  const query3 = `
    mutation testMutation($suffix: String) {
      field1(suffix: $suffix)
    }
  `
  expect(extractOperationName(query3)).toBe('testMutation')
})
