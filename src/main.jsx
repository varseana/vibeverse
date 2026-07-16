import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './lib/auth.jsx'
import { StoreProvider } from './lib/store.jsx'
import App from './App.jsx'
import './styles.css'

// HashRouter keeps routing client-side only, perfect for an S3/CloudFront SPA
// with no server rewrites needed.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
)
