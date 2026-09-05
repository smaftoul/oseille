import { StrictMode } from 'react'
import { HashRouter } from 'react-router-dom'
import App from './App.tsx'

export default function AppRoot() {
  return (
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>
  )
}