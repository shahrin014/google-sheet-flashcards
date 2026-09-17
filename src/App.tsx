import { DeckProvider } from './components/DeckProvider'
import Study from './components/Study'

export default function App() {
  return (
    <DeckProvider>
      <Study />
    </DeckProvider>
  )
}
