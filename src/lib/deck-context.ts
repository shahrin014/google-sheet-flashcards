import { createContext, useContext } from 'react'
import { type CardDeck } from './storage'

export interface DeckContextValue {
  deck: CardDeck
  order: string[]
  keptRows: Record<string, string>[]
  revealed: boolean
  setRevealed: (v: boolean) => void
  sheet: any | null
  setSheet: (v: any) => void
  sheetError: string | null
  setSheetError: (v: string | null) => void
  deckReady: boolean
  setDeckReady: (v: boolean) => void
  dueCards: any[]
  currentId: string | undefined
  currentRow: any | undefined
  frontSections: any[]
  backSections: any[]
  tags: string[]
  newCount: number
  reviewedToday: number
  ratingIntervals: any[]
  handleRate: (rating: any) => void
  handleResetProgress: () => void
  handleClearAll: () => void
  handleConfirmClearAll: () => void
  handleCancelClearAll: () => void
  handleCopyShareLink: () => void
  clearOpen: boolean
  setClearOpen: (v: boolean) => void
  notice: { kind: 'success' | 'error'; text: string } | null
}

export const DeckContext = createContext<DeckContextValue | null>(null)

export function useDeckState() {
  const context = useContext(DeckContext)
  if (!context) {
    throw new Error('useDeckState must be used within a DeckProvider')
  }
  return context
}
