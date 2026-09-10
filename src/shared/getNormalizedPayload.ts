import type { SubscribePayload } from 'graphql-ws'

/**
 * Extracts Operation name from GraphQL query string.
 */
export const extractOperationName = (query: string): string | undefined => {
  const ignoredChars = String.raw`(?:\uFEFF|[\s,])`
  const comment = String.raw`#[^\r\n]*(?:\r\n?|\n|$)`

  const ignored = `(?:${ignoredChars}|${comment})`

  const graphqlOperationRegex = new RegExp(
    String.raw`^${ignored}*(?:query|mutation|subscription)(?!#)${ignored}+([_A-Za-z][_0-9A-Za-z]*)`
  )

  const operationMatch = query.match(graphqlOperationRegex)

  return operationMatch?.[1]
}

/**
 * Noramlizes the payload, to use in deep structural comparison.
 */
export const getNormalizedPayload = (
  payload: SubscribePayload
): Required<SubscribePayload> => {
  const operationName =
    payload.operationName ?? extractOperationName(payload.query)

  return {
    extensions: {},
    variables: {},
    operationName: operationName ?? null,
    ...payload,
  }
}
