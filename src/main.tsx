import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { loadSettings, type Settings } from './lib/storage'
import './index.css'
import App from './App.tsx'

const paramUrl = new URLSearchParams(window.location.search).get('sheet')
const stored = loadSettings()

const initial: { initialUrl: string; initialSettings: Settings | null } =
  paramUrl && paramUrl !== stored?.sheetUrl
    ? { initialUrl: paramUrl, initialSettings: null }
    : { initialUrl: '', initialSettings: stored }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialUrl={initial.initialUrl} initialSettings={initial.initialSettings} />
  </StrictMode>,
)