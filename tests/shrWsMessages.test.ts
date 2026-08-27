import {
  isShrWsMessage,
  shrWsMessageTypeGuard,
  type ShrClientMessagesUnion,
} from '@graphql-shared-ws'
import { GRAPHQL_TRANSPORT_WS_PROTOCOL } from 'graphql-ws'
import { describe, expect, expectTypeOf, it } from 'vitest'
import type { SharedWsMessages } from '../dist/main/index.d.mts'

describe('type guard for gql-she-ws messages.', () => {
  it('returns true for gql-shr-ws messages', () => {
    const message: ShrClientMessagesUnion = {
      messageType: 'shr-ws-get-facade-id',
      socketId: ['', GRAPHQL_TRANSPORT_WS_PROTOCOL],
    }

    expect(isShrWsMessage(message)).toBe(true)
  })
  it('narrows the type.', () => {
    const message = {
      messageType: 'shr-ws-get-facade-id',
      socketId: ['', GRAPHQL_TRANSPORT_WS_PROTOCOL],
    } satisfies ShrClientMessagesUnion

    if (!isShrWsMessage(message)) throw new Error()

    expectTypeOf<SharedWsMessages['toWorker']['getFacadeId']>(message)
  })
  it('returns false for non gql-shr-ws messages', () => {
    const message = {
      a: 1,
    }

    expect(isShrWsMessage(message)).toBe(false)
  })
  it('returns false for messages with unknown messageType', () => {
    const invalidMessages: Array<{
      [Key in keyof Pick<ShrClientMessagesUnion, 'messageType'>]: unknown
    }> = [
      {
        messageType: 'invalid',
      },
      {
        messageType: undefined,
      },
    ]

    for (const message of invalidMessages) {
      expect(isShrWsMessage(message)).toBe(false)
    }
  })
})

describe('generic type guard to narrow by messageType.', () => {
  it('works', () => {
    const message: ShrClientMessagesUnion = {
      messageType: 'shr-ws-get-facade-id',
      socketId: ['', GRAPHQL_TRANSPORT_WS_PROTOCOL],
    }

    expect(shrWsMessageTypeGuard(message, 'shr-ws-get-facade-id')).toBe(true)
    expect(shrWsMessageTypeGuard(message, 'shr-ws-close')).toBe(false)
  })

  it('narrows type.', () => {
    const message = {
      messageType: 'shr-ws-get-facade-id',
      socketId: ['', GRAPHQL_TRANSPORT_WS_PROTOCOL],
    } satisfies ShrClientMessagesUnion

    if (!shrWsMessageTypeGuard(message, 'shr-ws-get-facade-id'))
      throw new Error()

    expectTypeOf<SharedWsMessages['toWorker']['getFacadeId']>(message)
  })
})
