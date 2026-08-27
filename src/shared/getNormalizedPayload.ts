import type { SubscribePayload } from 'graphql-ws'

/**
 * Extracts Operation name from GraphQL query string.
 */
export const extractOperationName = (query: string): string | undefined => {
  const secondToken = query.trim().split(' ')[1]
  if (!secondToken) return undefined
  if (secondToken.startsWith('(') || secondToken.startsWith('{'))
    return undefined
  const indexOfParamBrace = secondToken.indexOf('(')
  if (indexOfParamBrace === -1) return secondToken
  return secondToken.slice(0, indexOfParamBrace)
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
