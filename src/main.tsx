import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createTheme, MantineProvider, type MantineColorsTuple } from '@mantine/core'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { loadSettings, type Settings } from './lib/storage'
import { SettingsProvider } from './components/SettingsProvider'
import { paramsToSettings } from './lib/url'
import '@mantine/core/styles.css'
import './index.css'
import App from './App.tsx'
import IndexRedirect from './components/IndexRedirect.tsx'
import SetupLayout from './components/SetupLayout.tsx'
import StepUrl from './components/StepUrl.tsx'
import StepColumns from './components/StepColumns.tsx'
import Presets from './components/Presets.tsx'
import { registerSW } from 'virtual:pwa-register'

const params = new URLSearchParams(window.location.search)
const urlSettings = paramsToSettings(params)

const initial: { initialUrl: string; initialSettings: Settings | null } = urlSettings
  ? { initialUrl: '', initialSettings: urlSettings }
  : { initialUrl: params.get('sheet') ?? loadSettings()?.sheetUrl ?? '', initialSettings: loadSettings() }

const brand: MantineColorsTuple = [
  '#eef4ff',
  '#e0eaff',
  '#c7d7fe',
  '#a4bcfd',
  '#8098f9',
  '#6172f3',
  '#444ce7',
  '#3538cd',
  '#2d31a6',
  '#2a2d7f',
]

const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 6 },
  colors: { brand },
  defaultRadius: 'md',
})

if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
  registerSW({ immediate: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <HashRouter>
        <SettingsProvider initialSettings={initial.initialSettings}>
          <Routes>
            <Route path="/" element={<IndexRedirect />} />
            <Route path="/study" element={<App />} />
            <Route path="/presets" element={<Presets />} />
            <Route path="/setup" element={<SetupLayout initialUrl={initial.initialUrl} />}>
              <Route index element={<StepUrl />} />
              <Route path="columns" element={<StepColumns />} />
            </Route>
            <Route path="*" element={<IndexRedirect />} />
          </Routes>
        </SettingsProvider>
      </HashRouter>
    </MantineProvider>
  </StrictMode>,
)