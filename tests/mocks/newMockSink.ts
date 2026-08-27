import type { Client } from 'graphql-ws'
import { vi, type Mock } from 'vitest'
/**
 * Provides a sink with mock functions.
 */
export const newMockSink = (): Record<
  keyof Parameters<Client['subscribe']>[1],
  Mock
> => {
  return {
    next: vi.fn(),
    error: vi.fn(),
    complete: vi.fn(),
  }
}
