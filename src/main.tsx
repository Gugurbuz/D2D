import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ErrorBoundary from './shared/components/ErrorBoundary'
import { QueryProvider } from './shared/providers/QueryProvider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <App />
      </QueryProvider>
    </ErrorBoundary>
  </StrictMode>,
)