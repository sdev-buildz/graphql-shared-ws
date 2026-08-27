import ReactDOM from 'react-dom/client'
import { App } from './App'
import { HtmlHeadChildren } from './HtmlHeadChildren'
import './index.css'

/**
 * Mounts the children of the head tag such as Script tags, Link tags, etc...
 *  onto the HTML head tag.
 */
const mountHeadTag = () => {
  const headTag = document.getElementsByTagName('head')[0]
  if (!headTag) {
    console.error('Error in getting the HTML Head tag')
  }
  if (headTag) {
    const headRoot = ReactDOM.createRoot(headTag)
    headRoot.render(<HtmlHeadChildren />)
  }
}

mountHeadTag()

/**
 * Mounts our React app into the HTML document.
 */
const mountApp = () => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') ?? document.body
  )

  root.render(
    // <StrictMode>
    <App />
    // </StrictMode>
  )
}
mountApp()
