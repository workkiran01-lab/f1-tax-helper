import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './index.css'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.1,
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={
      <div style={{ minHeight: '100vh', background: '#080c14', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', fontFamily: 'sans-serif' }}>
        <p style={{ fontSize: '48px', margin: 0 }}>⚠</p>
        <p style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>Something went wrong</p>
        <p style={{ fontSize: '14px', margin: 0 }}>Please refresh the page or return home.</p>
        <a href="/" style={{ marginTop: '8px', padding: '10px 24px', background: '#3b82f6', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Go home</a>
      </div>
    }>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
