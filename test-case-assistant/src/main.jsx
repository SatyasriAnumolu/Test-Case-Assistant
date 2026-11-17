import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FluentProvider } from '@fluentui/react-components'
import { lightTheme } from './theme/palette'
import { AdoConnectionProvider } from './context/AdoConnectionContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FluentProvider theme={lightTheme} className="fluent-root">
      <AdoConnectionProvider>
        <App />
      </AdoConnectionProvider>
    </FluentProvider>
  </StrictMode>,
)
