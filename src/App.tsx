import { DeckProvider } from './components/DeckProvider'
import Study from './components/Study'
import { useSettings } from './lib/settings-context'
import { deckKey } from './lib/storage'

export default function App() {
  const { settings } = useSettings()
  return (
    <DeckProvider key={settings ? deckKey(settings) : 'no-settings'}>
      <Study />
    </DeckProvider>
  )
}