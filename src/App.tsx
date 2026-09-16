import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { State, type Card } from 'ts-fsrs'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Menu,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import './App.css'
import CardView from './components/Card'
import { hashString } from './lib/hash'
import { useSettings } from './lib/settings-context'
import {
  createScheduler,
  formatInterval,
  isDue,
  newCard,
  previewDues,
  Rating,
  scheduleCard,
} from './lib/scheduler'
import { fetchSheet, type SheetResult } from './lib/sheet'
import { settingsToParams } from './lib/url'
import {
  clearDeck,
  deckKey,
  loadDeck,
  saveDeck,
  type CardDeck,
  type ReviewLog,
  type Settings,
} from './lib/storage'

function cardIdFor(row: Record<string, string>, index: number, s: Settings): string {
  if (s.idCol) {
    const id = String(row[s.idCol] ?? '').trim()
    return id ? `${s.idCol}:${id}` : `h:${hashString(String(index))}`
  }
  const columns = [...new Set([...s.frontCols, ...s.backCols])]
  const values = columns.map((c) => String(row[c] ?? '')).join('\u0000')
  return `h:${hashString(values)}`
}

function App() {
  const { settings, clearAll } = useSettings()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState<SheetResult | null>(null)
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [deckReady, setDeckReady] = useState(true)
  const [deck, setDeck] = useState<CardDeck>(() => {
    if (settings) {
      return loadDeck(deckKey(settings.sheetUrl)) ?? { cards: {}, logs: [] }
    }
    return { cards: {}, logs: [] }
  })
  const cardsRef = useRef<Record<string, Card>>(deck.cards)
  const [order, setOrder] = useState<string[]>([])
  const [keptRows, setKeptRows] = useState<Record<string, string>[]>([])
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
    if (!settings || !sheet || !deckReady) return
    const dropped: { row: number; frontCols: string[]; backCols: string[] }[] = []
    const keptRowsLocal: Record<string, string>[] = []
    const ids = sheet.rows
      .map((row, i) => {
        const frontFilled = settings.frontCols.some((c) => String(row[c] ?? '').trim() !== '')
        const backFilled = settings.backCols.some((c) => String(row[c] ?? '').trim() !== '')
        if (!frontFilled || !backFilled) {
          dropped.push({ row: i, frontCols: settings.frontCols, backCols: settings.backCols })
          return null
        }
        keptRowsLocal.push(row)
        return cardIdFor(row, i, settings)
      })
      .filter((id): id is string => id !== null)
    if (import.meta.env.DEV) {
      const label = (r: Record<string, string>, cols: string[]) =>
        cols.map((c) => `${c}->${JSON.stringify(String(r[c] ?? '').trim())}`).join(', ')
      console.debug(
        `[filter] front=${JSON.stringify(settings.frontCols)} back=${JSON.stringify(settings.backCols)}`,
        `kept=${ids.length}/${sheet.rows.length}`,
        'dropped=',
        dropped.map((d) => `row${d.row}:${label(sheet.rows[d.row], [...d.frontCols, ...d.backCols])}`),
      )
    }
    setDeck((prev) => {
      const cards: Record<string, Card> = {}
      for (const id of ids) {
        cards[id] = cardsRef.current[id] ?? newCard()
      }
      cardsRef.current = cards
      return { cards, logs: prev.logs }
    })
    setKeptRows(keptRowsLocal)
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
  const currentRow = currentIndex >= 0 ? keptRows[currentIndex] : undefined
  const sections = (cols: string[]) =>
    currentRow && settings
      ? cols
          .map((col) => ({ label: col, value: String(currentRow[col] ?? '').trim() }))
          .filter((s) => s.value.length > 0)
      : []
  const frontSections = settings ? sections(settings.frontCols) : []
  const backSections = settings ? sections(settings.backCols) : []
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

  const ratingIntervals = useMemo(() => {
    const card = currentId ? deck.cards[currentId] : undefined
    if (!card) return []
    const now = new Date()
    const dues = previewDues(scheduler, card)
    return (
      [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as const
    ).map((rating) => ({ rating, label: formatInterval(now, dues[rating]) }))
  }, [currentId, deck.cards, scheduler])

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

  const handleClearAll = useCallback(() => {
    clearAll()
    navigate('/setup')
  }, [clearAll, navigate])

  const handleCopyShareLink = useCallback(async () => {
    if (!settings) return
    const params = settingsToParams(settings)
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* clipboard unavailable */
    }
  }, [settings])

  if (!settings) {
    return <Navigate to="/setup" replace />
  }

  return (
    <div className="app">
      <header className="topbar">
        <Title order={3} className="topbar-title">
          Sheet Flashcards
        </Title>
        <Group gap="xs">
          <Badge variant="light" color="indigo" title="New cards remaining">
            new {newCount}
          </Badge>
          <Badge variant="light" color="grape" title="Cards due now">
            due {dueCards.length}
          </Badge>
          <Badge variant="light" color="teal" title="Reviewed today">
            today {reviewedToday}
          </Badge>
        </Group>
        <Group gap="xs">
          <Menu shadow="md" width={220}>
            <Menu.Target>
              <ActionIcon
                variant="default"
                size="lg"
                aria-label="Open menu"
                aria-haspopup="menu"
                title="Menu"
              >
                <Group gap={3} className="burger" wrap="nowrap">
                  <span />
                  <span />
                  <span />
                </Group>
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => navigate('/setup')}>Change sheet</Menu.Item>
              <Menu.Item onClick={() => void handleCopyShareLink()}>Copy share link</Menu.Item>
              <Menu.Divider />
              <Menu.Item color="orange" onClick={handleResetProgress}>
                Reset progress
              </Menu.Item>
              <Menu.Item color="red" onClick={handleClearAll}>
                Clear memory
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </header>

      <main>
        {sheetError && (
          <Alert color="red" variant="light" w="100%" withCloseButton={false}>
            <Text size="sm">
              {sheetError}
              <Button
                variant="subtle"
                size="compact-xs"
                color="red"
                ml="sm"
                onClick={() => navigate('/setup')}
              >
                Configure sheet
              </Button>
            </Text>
          </Alert>
        )}

        {!sheet && !sheetError && (
          <Stack align="center" gap="sm">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading sheet…
            </Text>
          </Stack>
        )}

        {sheet && dueCards.length === 0 && (
          <div className="done">
            <Title order={2}>All caught up!</Title>
            <Text size="sm" c="dimmed">
              {newCount} new cards · {reviewedToday} reviewed today
            </Text>
            <Button variant="subtle" color="red" size="compact-sm" onClick={handleResetProgress}>
              Reset progress
            </Button>
          </div>
        )}

        {sheet && currentRow && currentId && (
          <CardView
            front={frontSections}
            back={backSections}
            tags={tags}
            revealed={revealed}
            isNew={deck.cards[currentId]?.state === State.New}
            ratings={ratingIntervals}
            onReveal={() => setRevealed(true)}
            onRate={handleRate}
          />
        )}
      </main>
    </div>
  )
}

export default App