import { useState } from 'react'
import { TestingPanel } from './components/TestingPanel/TestingPanel'

/**
 * The React App with the navbar, pages, routing, etc...
 * It includes the whole App Layout.
 */
export function App() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className='app'>
      <div>
        <header>
          <h1>Demo of grpahql-shared-ws.</h1>
        </header>
        <button type='button' onClick={() => setRefreshKey(refreshKey + 1)}>
          Refresh
        </button>
        <p>
          <button type='button'>
            Click here to open multiple browser windows side by side
          </button>
          Or else open this page in multiple tabs, or windows. And see how the
          Apollo Client state is synchronized.
        </p>
      </div>
      {/* <ProductsList /> */}
      <TestingPanel key={refreshKey} />
    </div>
  )
}
