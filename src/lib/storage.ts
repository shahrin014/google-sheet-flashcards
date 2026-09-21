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

export interface Preset {
  name: string
  settings: Settings
}

const SETTINGS_KEY = 'gsf.settings.v1'
const PRESETS_KEY = 'gsf.presets.v1'
const ACTIVE_PRESET_KEY = 'gsf.activePreset.v1'
const DECK_PREFIX = 'gsf.deck.'
const DECK_VERSION = 'v1'

function serialize(card: Card): Card {
  return { ...card, due: new Date(card.due) }
}

function revive(card: Card): Card {
  return { ...card, due: new Date(card.due) }
}

export function deckKey(settings: Settings): string {
  const combo = [
    settings.sheetUrl.toLowerCase(),
    ...settings.frontCols,
    ...settings.backCols,
    settings.tagsCol,
    settings.idCol,
  ].join('\u0000')
  return hashString(combo)
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
    return {
      sheetUrl: parsed.sheetUrl,
      frontCols: parsed.frontCols,
      backCols: parsed.backCols,
      tagsCol: parsed.tagsCol ?? '',
      idCol: parsed.idCol ?? '',
    }
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

export function loadPresets(): Preset[] {
  const raw = localStorage.getItem(PRESETS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p): p is Preset =>
        p != null &&
        typeof p.name === 'string' &&
        p.settings != null &&
        typeof p.settings.sheetUrl === 'string' &&
        Array.isArray(p.settings.frontCols) &&
        Array.isArray(p.settings.backCols),
    )
  } catch {
    return []
  }
}

export function savePreset(name: string, settings: Settings): void {
  const presets = loadPresets()
  const existing = presets.find((p) => p.name === name)
  if (existing) {
    existing.settings = settings
  } else {
    presets.push({ name, settings })
  }
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
}

export function deletePreset(name: string): void {
  localStorage.setItem(
    PRESETS_KEY,
    JSON.stringify(loadPresets().filter((p) => p.name !== name)),
  )
  if (loadActivePresetName() === name) saveActivePresetName(null)
}

export function loadActivePresetName(): string | null {
  return localStorage.getItem(ACTIVE_PRESET_KEY)
}

export function saveActivePresetName(name: string | null): void {
  if (name) localStorage.setItem(ACTIVE_PRESET_KEY, name)
  else localStorage.removeItem(ACTIVE_PRESET_KEY)
}