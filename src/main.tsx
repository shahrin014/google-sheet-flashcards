import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createTheme, MantineProvider } from '@mantine/core'
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

const params = new URLSearchParams(window.location.search)
const urlSettings = paramsToSettings(params)

const initial: { initialUrl: string; initialSettings: Settings | null } = urlSettings
  ? { initialUrl: '', initialSettings: urlSettings }
  : { initialUrl: params.get('sheet') ?? loadSettings()?.sheetUrl ?? '', initialSettings: loadSettings() }

const theme = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <HashRouter>
        <SettingsProvider initialSettings={initial.initialSettings}>
          <Routes>
            <Route path="/" element={<IndexRedirect />} />
            <Route path="/study" element={<App />} />
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