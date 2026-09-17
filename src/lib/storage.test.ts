import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearDeck,
  clearSettings,
  deckKey,
  loadDeck,
  loadSettings,
  saveDeck,
  saveSettings,
  type CardDeck,
  type Settings,
} from './storage'
import { newCard } from './scheduler'

class MemoryStorage implements Storage {
  store = new Map<string, string>()
  get length(): number {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

function storage(): Map<string, string> {
  return (globalThis.localStorage as MemoryStorage)['store']
}

const settings: Settings = {
  sheetUrl: 'https://docs.google.com/spreadsheets/d/e/EXAMPLE/pub?output=csv',
  frontCols: ['Word'],
  backCols: ['Meaning'],
  tagsCol: 'Tags',
  idCol: '',
}

describe('settings persistence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it('round-trips saveSettings/loadSettings', () => {
    saveSettings(settings)
    expect(loadSettings()).toEqual(settings)
  })

  it('returns null when nothing is stored', () => {
    expect(loadSettings()).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    localStorage.setItem('gsf.settings.v1', '{not json')
    expect(loadSettings()).toBeNull()
  })

  it('returns null when required fields are missing', () => {
    localStorage.setItem('gsf.settings.v1', JSON.stringify({ frontCols: ['A'] }))
    expect(loadSettings()).toBeNull()
    localStorage.setItem('gsf.settings.v1', JSON.stringify({ sheetUrl: 'x', frontCols: [], backCols: [] }))
    expect(loadSettings()).toBeNull()
  })

  it('migrates legacy single-col frontCol/backCol fields', () => {
    localStorage.setItem(
      'gsf.settings.v1',
      JSON.stringify({ sheetUrl: 'x', frontCol: 'A', backCol: 'B' }),
    )
    expect(loadSettings()).toEqual({ sheetUrl: 'x', frontCols: ['A'], backCols: ['B'], tagsCol: '', idCol: '' })
  })

  it('clearSettings removes the stored settings', () => {
    saveSettings(settings)
    clearSettings()
    expect(loadSettings()).toBeNull()
  })
})

describe('deckKey', () => {
  it('is deterministic for identical settings', () => {
    expect(deckKey(settings)).toBe(deckKey(settings))
  })

  it('ignores sheet URL case', () => {
    expect(deckKey(settings)).toBe(deckKey({ ...settings, sheetUrl: settings.sheetUrl.toUpperCase() }))
  })

  it('differs when the sheet URL changes', () => {
    expect(deckKey(settings)).not.toBe(deckKey({ ...settings, sheetUrl: 'https://example.com/other' }))
  })

  it('differs when column mapping changes', () => {
    expect(deckKey(settings)).not.toBe(deckKey({ ...settings, frontCols: ['Word', 'Reading'] }))
    expect(deckKey(settings)).not.toBe(deckKey({ ...settings, backCols: ['Meaning', 'Example'] }))
    expect(deckKey(settings)).not.toBe(deckKey({ ...settings, tagsCol: 'X' }))
    expect(deckKey(settings)).not.toBe(deckKey({ ...settings, idCol: 'Id' }))
  })
})

describe('deck persistence', () => {
  const key = deckKey(settings)

  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it('round-trips saveDeck/loadDeck with revived dates', () => {
    const card = newCard()
    const deck: CardDeck = {
      cards: { card1: card },
      logs: [{ cardId: 'card1', rating: 3, reviewDate: '2026-01-01T00:00:00.000Z', due: card.due.toISOString() }],
    }
    saveDeck(key, deck)

    const loaded = loadDeck(key)
    expect(loaded).not.toBeNull()
    expect(loaded?.cards.card1.due).toBeInstanceOf(Date)
    expect(loaded?.cards.card1.due.toISOString()).toBe(card.due.toISOString())
    expect(loaded?.logs).toEqual(deck.logs)
  })

  it('returns null when no deck is stored', () => {
    expect(loadDeck(key)).toBeNull()
  })

  it('returns null for corrupt deck JSON', () => {
    localStorage.setItem('gsf.deck.mykey.v1', 'not json')
    expect(loadDeck('mykey')).toBeNull()
  })

  it('saves under a namespaced, versioned key', () => {
    saveDeck(key, { cards: {}, logs: [] })
    expect(storage().has(`gsf.deck.${key}.v1`)).toBe(true)
  })

  it('clearDeck removes only the targeted deck', () => {
    const other = deckKey({ ...settings, frontCols: ['Other'] })
    saveDeck(key, { cards: {}, logs: [] })
    saveDeck(other, { cards: {}, logs: [] })
    clearDeck(key)
    expect(loadDeck(key)).toBeNull()
    expect(loadDeck(other)).not.toBeNull()
  })
})