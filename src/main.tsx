import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import './index.css'
import { AccessProvider } from './access.tsx'
import App from './App.tsx'

// Hosted previews (e.g. claude.ai artifacts) serve from a sub-path, so they use hash URLs.
const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter

// Keeps the encrypted archive files on this device once fetched (public/sw.js),
// so a second visit does not download the photos again. Live site only.
if ('serviceWorker' in navigator && import.meta.env.PROD && import.meta.env.VITE_ROUTER !== 'hash') {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <AccessProvider>
        <App />
      </AccessProvider>
    </Router>
  </StrictMode>,
)
