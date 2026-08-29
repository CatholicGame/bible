import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import HostConsole from './components/host/HostConsole.jsx'

const isHostMode = new URLSearchParams(window.location.search).get('host') === '1'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isHostMode ? <HostConsole /> : <App />}
  </StrictMode>,
)
