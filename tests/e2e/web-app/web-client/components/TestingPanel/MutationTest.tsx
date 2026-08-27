import type { Mutation, Query } from '@types-gen-react-apollo'
import { createSharedClient } from 'graphql-shared-ws'
import { useCallback, useState } from 'react'
import sharedConfig from '../../../shared/config'
import type { GqlQueryResult } from '../../util/types'

const gqlClient = createSharedClient({
  url: sharedConfig.graphqlWssEndpoint,
})

/**
 * To test mutation type operations
 */
export const MutationTest = () => {
  const [mutationInput, setMutationInput] = useState('a random text')
  const [mutationState, setMutationState] = useState<GqlQueryResult>({})
  const mutate = useCallback(
    async ({ variables }: { variables: { value: string } }) => {
      gqlClient.subscribe<Pick<Mutation, 'setMutableField'>>(
        {
          query: `
      mutation mutate($value: String!) {
        setMutableField(value: $value)
      }
    `,
          variables: {
            value: variables.value ?? mutationInput,
          },
        },
        {
          next: (n) => {
            setMutationState((prev) => ({
              ...prev,
              lastResult: n.data?.setMutableField ?? '',
            }))
          },
          error: (err: unknown) => {
            setMutationState((prev) => ({
              ...prev,
              error: err,
            }))
          },
          complete: () => {
            setMutationState((prev) => ({
              ...prev,
              completed: true,
            }))
          },
        }
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutationState]
  )

  const [queriedMutableField, setQueriedMutableField] =
    useState<GqlQueryResult>({})
  const queryField = useCallback(() => {
    const unsubscribe = gqlClient.subscribe<Pick<Query, 'mutableField'>>(
      {
        query: `
      query mutable {
        mutableField
      }
    `,
      },
      {
        next: (n) => {
          setQueriedMutableField((prev) => ({
            ...prev,
            lastResult: n.data?.mutableField ?? '',
          }))
        },
        error: (err: unknown) => {
          setQueriedMutableField((prev) => ({
            ...prev,
            error: err,
          }))
        },
        complete: () => {
          setQueriedMutableField((prev) => ({
            ...prev,
            completed: true,
          }))
        },
      }
    )
    setQueriedMutableField({
      ...queriedMutableField,
      unsubscribe,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className='mutation-operation'>
      {/* To test mutation type operations */}
      {/* Mutation form */}
      <form id='mutation-form'>
        <dl>
          <dt>Mutation result of Mutable Field:</dt>
          <dd data-testid='mutable-field-value'>
            {mutationState.lastResult ?? ''}
          </dd>
        </dl>
        <label htmlFor='mutation-input'>
          Enter new value for mutable field
        </label>
        <input
          id='mutation-input'
          data-testid='mutation-input'
          type='text'
          onChange={(e) => setMutationInput(e.target.value)}
          value={mutationInput}
        ></input>
        <button
          data-testid='mutate-mutable-field'
          type='submit'
          onClick={(e) => {
            e.preventDefault()
            mutate({ variables: { value: mutationInput } })
          }}
        >
          Set Mutable Field
        </button>
      </form>
      <dl>
        <dt>Queried Mutable Field:</dt>
        <dd data-testid='queried-mutable-field-value'>
          {mutationState.lastResult}
        </dd>
      </dl>
      <button
        data-testid='refetch-mutable'
        type='button'
        onClick={() => queryField()}
      >
        Refetch Mutable Field
      </button>
    </section>
  )
}
