import { ConnectionErrorTester } from './ConnectionErrorTester'
import { ErrorTest } from './ErrorTester'
import { MutationTest } from './MutationTest'
import { QueryTest } from './QueryTest'
import { TestConcurrentSubscriptions } from './TestConcurrentSubscriptions'

/**
 * All the products available
 */
export const TestingPanel = () => {
  return (
    <section className='testing-panel'>
      <hgroup>
        <h2>Testing Panel</h2>
        <p>Use the following buttons to test the operations</p>
      </hgroup>
      <QueryTest />
      <MutationTest />
      <TestConcurrentSubscriptions />
      <ErrorTest />
      <ConnectionErrorTester />
    </section>
  )
}
