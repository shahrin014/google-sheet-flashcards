import { useCallback, useState, type ReactNode } from 'react'
import { saveSettings, type Settings } from '../lib/storage'
import { SettingsContext } from '../lib/settings-context'
import { updateUrl } from '../lib/url'

export function SettingsProvider({
  initialSettings,
  children,
}: {
  initialSettings: Settings | null
  children: ReactNode
}) {
  const [settings, setSettingsState] = useState<Settings | null>(initialSettings)

  const setSettings = useCallback((next: Settings) => {
    saveSettings(next)
    updateUrl(next)
    setSettingsState(next)
  }, [])

  const clearAll = useCallback(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('gsf.')) localStorage.removeItem(key)
    }
    setSettingsState(null)
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, setSettings, clearAll }}>
      {children}
    </SettingsContext.Provider>
  )
}