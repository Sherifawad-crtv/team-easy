import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // Remove workers left behind by earlier builds of this site (Flutter).
    navigator.serviceWorker
      .getRegistrations()
      .then((all) =>
        Promise.all(
          all
            .filter((r) => !(r.active?.scriptURL ?? '').endsWith('/sw.js'))
            .filter((r) => !(r.installing || r.waiting))
            .map((r) => r.unregister()),
        ),
      )
      .catch(() => {})
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // offline support is a bonus; the app works without it
    })
  })
}
