import { createContext, useContext } from 'react'
import type { Settings } from './storage'

export interface SettingsContextValue {
  settings: Settings | null
  setSettings: (s: Settings) => void
  clearAll: () => void
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  setSettings: () => {},
  clearAll: () => {},
})

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext)
}