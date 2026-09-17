import { describe, expect, it } from 'vitest'
import {
  Rating,
  createScheduler,
  formatInterval,
  isDue,
  newCard,
  previewDues,
  scheduleCard,
} from './scheduler'

describe('newCard', () => {
  it('creates a new FSRS card', () => {
    const card = newCard()
    expect(card).toHaveProperty('state')
    expect(card.due).toBeInstanceOf(Date)
  })
})

describe('isDue', () => {
  it('treats missing cards as due', () => {
    expect(isDue(undefined, new Date())).toBe(true)
  })

  it('returns true when due is in the past or now', () => {
    const now = new Date(Date.parse('2026-01-15T12:00:00.000Z'))
    expect(isDue({ ...newCard(), due: new Date('2026-01-15T12:00:00.000Z') }, now)).toBe(true)
    expect(isDue({ ...newCard(), due: new Date('2026-01-14T12:00:00.000Z') }, now)).toBe(true)
  })

  it('returns false when due is in the future', () => {
    const now = new Date(Date.parse('2026-01-15T12:00:00.000Z'))
    expect(isDue({ ...newCard(), due: new Date('2026-01-16T12:00:00.000Z') }, now)).toBe(false)
  })
})

describe('formatInterval', () => {
  const from = new Date(Date.parse('2026-01-15T12:00:00.000Z'))

  it('formats sub-minute intervals', () => {
    expect(formatInterval(from, new Date(from.getTime() + 30_000))).toBe('<1m')
  })

  it('formats minutes', () => {
    expect(formatInterval(from, new Date(from.getTime() + 60_000))).toBe('1m')
    expect(formatInterval(from, new Date(from.getTime() + 30 * 60_000))).toBe('30m')
  })

  it('formats hours', () => {
    expect(formatInterval(from, new Date(from.getTime() + 90 * 60_000))).toBe('2h')
  })

  it('formats days', () => {
    expect(formatInterval(from, new Date(from.getTime() + 86_400_000))).toBe('1d')
    expect(formatInterval(from, new Date(from.getTime() + 14 * 86_400_000))).toBe('14d')
  })

  it('formats months', () => {
    expect(formatInterval(from, new Date(from.getTime() + 40 * 86_400_000))).toBe('1mo')
  })

  it('formats years', () => {
    expect(formatInterval(from, new Date(from.getTime() + 380 * 86_400_000))).toBe('1yr')
  })
})

describe('scheduling', () => {
  it('previewDues increase with better ratings', () => {
    const scheduler = createScheduler()
    const dues = previewDues(scheduler, newCard())
    expect(dues[Rating.Again].getTime()).toBeLessThanOrEqual(dues[Rating.Hard].getTime())
    expect(dues[Rating.Hard].getTime()).toBeLessThanOrEqual(dues[Rating.Good].getTime())
    expect(dues[Rating.Good].getTime()).toBeLessThanOrEqual(dues[Rating.Easy].getTime())
  })

  it('scheduleCard moves the due date forward in time', () => {
    const scheduler = createScheduler()
    const card = newCard()
    const before = Date.now()
    const next = scheduleCard(scheduler, card, Rating.Good)
    expect(next.due.getTime()).toBeGreaterThanOrEqual(before)
  })

  it('records progress on repeating ratings', () => {
    const scheduler = createScheduler()
    const card = newCard()
    const first = scheduleCard(scheduler, card, Rating.Good)
    const second = scheduleCard(scheduler, first, Rating.Good)
    expect(second.due.getTime()).toBeGreaterThan(first.due.getTime())
  })
})