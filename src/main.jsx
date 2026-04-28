import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App'
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
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', fontFamily: 'sans-serif' }}>
        <p style={{ fontSize: '48px', margin: 0 }}>⚠</p>
        <p style={{ fontSize: '18px', fontWeight: 600, color: '#f1f5f9', margin: 0 }}>Something went wrong</p>
        <p style={{ fontSize: '14px', margin: 0 }}>Please refresh the page or return home.</p>
        <a href="/" style={{ marginTop: '8px', padding: '10px 24px', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Go home</a>
      </div>
    }>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
