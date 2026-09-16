import type { Card } from 'ts-fsrs'
import type { Rating } from './scheduler'
import { hashString } from './hash'

export interface ReviewLog {
  cardId: string
  rating: Rating
  reviewDate: string
  due: string
}

export interface CardDeck {
  cards: Record<string, Card>
  logs: ReviewLog[]
}

export interface Settings {
  sheetUrl: string
  frontCols: string[]
  backCols: string[]
  tagsCol: string
  idCol: string
}

const SETTINGS_KEY = 'gsf.settings.v1'
const DECK_PREFIX = 'gsf.deck.'
const DECK_VERSION = 'v1'

function serialize(card: Card): Card {
  return { ...card, due: new Date(card.due) }
}

function revive(card: Card): Card {
  return { ...card, due: new Date(card.due) }
}

export function deckKey(sheetUrl: string): string {
  return hashString(sheetUrl.toLowerCase())
}

export function loadSettings(): Settings | null {
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<Settings> & {
      backCol?: string
      frontCol?: string
    }
    if (!parsed.sheetUrl) return null
    if (!Array.isArray(parsed.frontCols)) {
      parsed.frontCols = parsed.frontCol ? [parsed.frontCol] : []
    }
    if (!Array.isArray(parsed.backCols)) {
      parsed.backCols = parsed.backCol ? [parsed.backCol] : []
    }
    if (!parsed.frontCols.length || !parsed.backCols.length) return null
    return parsed as Settings
  } catch {
    return null
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function clearSettings(): void {
  localStorage.removeItem(SETTINGS_KEY)
}

export function loadDeck(key: string): CardDeck | null {
  const raw = localStorage.getItem(`${DECK_PREFIX}${key}.${DECK_VERSION}`)
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as CardDeck
    const cards: Record<string, Card> = {}
    for (const [id, card] of Object.entries(data.cards ?? {})) {
      cards[id] = revive(card)
    }
    return { cards, logs: data.logs ?? [] }
  } catch {
    return null
  }
}

export function saveDeck(key: string, deck: CardDeck): void {
  const cards: Record<string, Card> = {}
  for (const [id, card] of Object.entries(deck.cards)) {
    cards[id] = serialize(card)
  }
  localStorage.setItem(`${DECK_PREFIX}${key}.${DECK_VERSION}`, JSON.stringify({ cards, logs: deck.logs }))
}

export function clearDeck(key: string): void {
  localStorage.removeItem(`${DECK_PREFIX}${key}.${DECK_VERSION}`)
}