import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { State, type Card } from 'ts-fsrs'
import {
  createScheduler,
  formatInterval,
  isDue,
  newCard,
  previewDues,
  Rating,
  scheduleCard,
} from '../lib/scheduler'
import { fetchSheet, type SheetResult } from '../lib/sheet'
import {
  clearDeck,
  deckKey,
  loadDeck,
  saveDeck,
  type CardDeck,
  type ReviewLog,
  type Settings,
} from '../lib/storage'
import { settingsToParams } from '../lib/url'
import { useSettings } from '../lib/settings-context'
import { DeckContext } from '../lib/deck-context'
import { hashString } from '../lib/hash'

function cardIdFor(row: Record<string, string>, index: number, s: Settings): string {
  if (s.idCol) {
    const id = String(row[s.idCol] ?? '').trim()
    return id ? `${s.idCol}:${id}` : `h:${hashString(String(index))}`
  }
  const columns = [...new Set([...s.frontCols, ...s.backCols])]
  const values = columns.map((c) => String(row[c] ?? '')).join('\u0000')
  return `h:${hashString(values)}`
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* fall through to execCommand */
    }
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  textarea.remove()
  return ok
}

export function DeckProvider({ children }: { children: ReactNode }) {
  const { settings, clearAll } = useSettings()
  const navigate = useNavigate()

  const [sheet, setSheet] = useState<SheetResult | null>(null)
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [deckReady, setDeckReady] = useState(true)
  const [deck, setDeck] = useState<CardDeck>(() => {
    if (settings) {
      return loadDeck(deckKey(settings)) ?? { cards: {}, logs: [] }
    }
    return { cards: {}, logs: [] }
  })
  const cardsRef = useRef<Record<string, Card>>(deck.cards)
  const [order, setOrder] = useState<string[]>([])
  const [keptRows, setKeptRows] = useState<Record<string, string>[]>([])
  const [revealed, setRevealed] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const noticeTimer = useRef<number | undefined>(undefined)

  const scheduler = useMemo(() => createScheduler(), [])

  useEffect(() => {
    cardsRef.current = deck.cards
  }, [deck.cards])

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
        const frontFilled = settings.frontCols.some((c: string) => String(row[c] ?? '').trim() !== '')
        const backFilled = settings.backCols.some((c: string) => String(row[c] ?? '').trim() !== '')
        if (!frontFilled || !backFilled) {
          dropped.push({ row: i, frontCols: settings.frontCols, backCols: settings.backCols })
          return null
        }
        keptRowsLocal.push(row)
        return cardIdFor(row, i, settings)
      })
      .filter((id): id is string => id !== null)

    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[ids[i], ids[j]] = [ids[j], ids[i]]
      ;[keptRowsLocal[i], keptRowsLocal[j]] = [keptRowsLocal[j], keptRowsLocal[i]]
    }

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
    saveDeck(deckKey(settings), deck)
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
    clearDeck(deckKey(settings))
    cardsRef.current = {}
    setDeck({ cards: {}, logs: [] })
    setOrder([])
    setRevealed(false)
    setDeckReady(false)
    window.setTimeout(() => setDeckReady(true), 0)
  }, [settings])

  const handleClearAll = useCallback(() => {
    setClearOpen(true)
  }, [])

  const handleConfirmClearAll = useCallback(() => {
    clearAll()
    setClearOpen(false)
    navigate('/setup')
  }, [clearAll, navigate])

  const handleCancelClearAll = useCallback(() => {
    setClearOpen(false)
  }, [])

  const handleCopyShareLink = useCallback(async () => {
    if (!settings) return
    const params = settingsToParams(settings)
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}#/study`
    const ok = await copyToClipboard(url)
    window.clearTimeout(noticeTimer.current)
    setNotice(ok ? { kind: 'success', text: 'Share link copied' } : { kind: 'error', text: 'Could not copy link' })
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3000)
  }, [settings])

  const contextValue: any = {
    deck,
    order,
    keptRows,
    revealed,
    setRevealed,
    sheet,
    setSheet,
    sheetError,
    setSheetError,
    deckReady,
    setDeckReady,
    dueCards,
    currentId,
    currentRow,
    frontSections,
    backSections,
    tags,
    newCount,
    reviewedToday,
    ratingIntervals,
    handleRate,
    handleResetProgress,
    handleClearAll,
    handleConfirmClearAll,
    handleCancelClearAll,
    handleCopyShareLink,
    clearOpen,
    setClearOpen,
    notice,
  }

  return <DeckContext.Provider value={contextValue}>{children}</DeckContext.Provider>
}
