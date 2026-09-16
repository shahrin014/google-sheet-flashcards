import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { State, type Card } from 'ts-fsrs'
import './App.css'
import CardView from './components/Card'
import Setup from './components/Setup'
import { hashString } from './lib/hash'
import {
  createScheduler,
  isDue,
  newCard,
  Rating,
  scheduleCard,
} from './lib/scheduler'
import { fetchSheet, type SheetResult } from './lib/sheet'
import {
  clearDeck,
  deckKey,
  loadDeck,
  saveDeck,
  saveSettings,
  type CardDeck,
  type ReviewLog,
  type Settings,
} from './lib/storage'

interface Props {
  initialUrl: string
  initialSettings: Settings | null
}

function cardIdFor(row: Record<string, string>, index: number, s: Settings): string {
  if (s.idCol) {
    const id = String(row[s.idCol] ?? '').trim()
    return id ? `${s.idCol}:${id}` : `h:${hashString(String(index))}`
  }
  const front = String(row[s.frontCol] ?? '')
  const back = String(row[s.backCol] ?? '')
  return `h:${hashString(`${front}\u0000${back}`)}`
}

function App({ initialUrl, initialSettings }: Props) {
  const [settings, setSettings] = useState<Settings | null>(initialSettings)
  const [showSetup, setShowSetup] = useState<boolean>(!initialSettings)
  const [sheet, setSheet] = useState<SheetResult | null>(null)
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [deckReady, setDeckReady] = useState(true)
  const [deck, setDeck] = useState<CardDeck>(() => {
    if (initialSettings) {
      return loadDeck(deckKey(initialSettings.sheetUrl)) ?? { cards: {}, logs: [] }
    }
    return { cards: {}, logs: [] }
  })
  const cardsRef = useRef<Record<string, Card>>(deck.cards)
  const [order, setOrder] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    cardsRef.current = deck.cards
  }, [deck.cards])

  const scheduler = useMemo(() => createScheduler(), [])

  useEffect(() => {
    if (!settings) return
    let cancelled = false
    fetchSheet(settings.sheetUrl, true)
      .then((result) => {
        if (cancelled) return
        setSheet(result)
      })
      .catch((err) => {
        if (cancelled) return
        setSheetError(err instanceof Error ? err.message : 'Failed to load the sheet.')
      })
    return () => {
      cancelled = true
    }
  }, [settings])

  useEffect(() => {
    if (!settings) return
    const params = new URLSearchParams(window.location.search)
    params.set('sheet', settings.sheetUrl)
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
  }, [settings])

  useEffect(() => {
    if (!settings || !sheet || !deckReady) return
    const ids = sheet.rows.map((row, i) => cardIdFor(row, i, settings))
    setDeck((prev) => {
      const cards: Record<string, Card> = {}
      for (const id of ids) {
        cards[id] = cardsRef.current[id] ?? newCard()
      }
      cardsRef.current = cards
      return { cards, logs: prev.logs }
    })
    setOrder(ids)
  }, [settings, sheet, deckReady])

  useEffect(() => {
    if (!settings || !sheet || !deckReady) return
    saveDeck(deckKey(settings.sheetUrl), deck)
  }, [deck, settings, sheet, deckReady])

  const dueCards = useMemo(() => {
    if (!sheet) return []
    return order.filter((id) => isDue(deck.cards[id], new Date()))
  }, [sheet, order, deck.cards])

  const currentId = dueCards[0]
  const currentIndex = currentId ? order.indexOf(currentId) : -1
  const currentRow = currentIndex >= 0 && sheet ? sheet.rows[currentIndex] : undefined
  const front = currentRow ? String(currentRow[settings?.frontCol ?? ''] ?? '') : ''
  const back = currentRow ? String(currentRow[settings?.backCol ?? ''] ?? '') : ''
  const tags =
    currentRow && settings?.tagsCol
      ? String(currentRow[settings.tagsCol] ?? '')
          .split(/[,\s]+/)
          .map((t) => t.trim())
          .filter(Boolean)
      : []

  const newCount = useMemo(
    () => order.filter((id) => deck.cards[id]?.state === State.New).length,
    [order, deck.cards],
  )
  const today = new Date().toISOString().slice(0, 10)
  const reviewedToday = deck.logs.filter((l) => l.reviewDate.slice(0, 10) === today).length

  const handleSubmit = useCallback((next: Settings) => {
    saveSettings(next)
    setSettings(next)
    setShowSetup(false)
    setSheet(null)
    setSheetError(null)
    setOrder([])
    setRevealed(false)
  }, [])

  const handleRate = useCallback(
    (rating: Rating) => {
      if (!currentId || !currentRow || !settings) return
      const card = deck.cards[currentId]
      if (!card) return
      const nextCard = scheduleCard(scheduler, card, rating)
      const log: ReviewLog = {
        cardId: currentId,
        rating,
        reviewDate: new Date().toISOString(),
        due: nextCard.due.toISOString(),
      }
      setDeck((prev) => ({
        cards: { ...prev.cards, [currentId]: nextCard },
        logs: [...prev.logs, log],
      }))
      setRevealed(false)
    },
    [currentId, currentRow, settings, deck.cards, scheduler],
  )

  const handleResetProgress = useCallback(() => {
    if (!settings) return
    clearDeck(deckKey(settings.sheetUrl))
    cardsRef.current = {}
    setDeck({ cards: {}, logs: [] })
    setOrder([])
    setRevealed(false)
    setDeckReady(false)
    window.setTimeout(() => setDeckReady(true), 0)
  }, [settings])

  if (showSetup || !settings) {
    return <Setup initialUrl={initialUrl || settings?.sheetUrl || ''} onSubmit={handleSubmit} />
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>Sheet Flashcards</h1>
        <div className="stats">
          <span title="New cards remaining">new {newCount}</span>
          <span title="Cards due now">due {dueCards.length}</span>
          <span title="Reviewed today">today {reviewedToday}</span>
        </div>
        <div className="actions">
          <button className="ghost" onClick={() => setShowSetup(true)}>
            Change sheet
          </button>
          <button className="ghost" onClick={handleResetProgress}>
            Reset progress
          </button>
        </div>
      </header>

      <main>
        {sheetError && (
          <div className="banner error">
            <span>{sheetError}</span>
            <button className="ghost" onClick={() => setShowSetup(true)}>
              Configure sheet
            </button>
          </div>
        )}

        {!sheet && !sheetError && <div className="loading">Loading sheet…</div>}

        {sheet && dueCards.length === 0 && (
          <div className="done">
            <h2>All caught up!</h2>
            <p>
              {newCount} new cards · {reviewedToday} reviewed today
            </p>
            <button className="ghost" onClick={handleResetProgress}>
              Reset progress
            </button>
          </div>
        )}

        {sheet && currentRow && currentId && (
          <CardView
            front={front}
            back={back}
            tags={tags}
            revealed={revealed}
            isNew={deck.cards[currentId]?.state === State.New}
            onReveal={() => setRevealed(true)}
            onRate={handleRate}
          />
        )}
      </main>
    </div>
  )
}

export default App