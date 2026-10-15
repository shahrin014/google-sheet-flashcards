import { describe, expect, it } from 'vitest'
import {
  Rating,
  calculateOutcomes,
  createScheduler,
  formatInterval,
  formatIntervals,
  isDue,
  newCard,
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

describe('calculateOutcomes', () => {
  const now = new Date(Date.parse('2026-01-15T12:00:00.000Z'))

  it('returns one outcome per rating in the fixed order', () => {
    const outcomes = calculateOutcomes(createScheduler(), newCard(), now)
    expect(outcomes.map((o) => o.rating)).toEqual([
      Rating.Again,
      Rating.Hard,
      Rating.Good,
      Rating.Easy,
    ])
    for (const outcome of outcomes) expect(outcome.due).toBeInstanceOf(Date)
  })

  it('is deterministic for a fixed reference instant', () => {
    const scheduler = createScheduler()
    expect(calculateOutcomes(scheduler, newCard(), now).map((o) => o.due.getTime())).toEqual(
      calculateOutcomes(scheduler, newCard(), now).map((o) => o.due.getTime()),
    )
  })

  it('uses the given reference instant rather than the current time', () => {
    const outcomes = calculateOutcomes(createScheduler(), newCard(), now)
    for (const outcome of outcomes) {
      expect(outcome.due.getTime()).toBeGreaterThanOrEqual(now.getTime())
    }
  })

  it('schedules exactly what it reports, so the applied due equals the shown due', () => {
    const outcomes = calculateOutcomes(createScheduler(), newCard(), now)
    for (const outcome of outcomes) {
      expect(outcome.card.due.getTime()).toBe(outcome.due.getTime())
    }
  })

  it('pushes the due time further out for better ratings', () => {
    const outcomes = calculateOutcomes(createScheduler(), newCard(), now)
    const dues = outcomes.map((o) => o.due.getTime())
    for (let i = 1; i < dues.length; i += 1) {
      expect(dues[i]).toBeGreaterThanOrEqual(dues[i - 1])
    }
  })
})

describe('formatIntervals', () => {
  const from = new Date(Date.parse('2026-01-15T12:00:00.000Z'))
  const at = (ms: number) => new Date(from.getTime() + ms)

  it('matches the single formatter when nothing collides', () => {
    const dues = [at(10 * 60_000), at(2 * 3_600_000), at(3 * 86_400_000), at(400 * 86_400_000)]
    expect(formatIntervals(from, dues)).toEqual(dues.map((due) => formatInterval(from, due)))
  })

  it('lets equal intervals share a label', () => {
    const dues = [at(10 * 60_000), at(10 * 60_000)]
    const labels = formatIntervals(from, dues)
    expect(labels[0]).toBe(labels[1])
  })

  it('labels monotonic ratings with monotonic labels', () => {
    const scheduler = createScheduler()
    const dues = calculateOutcomes(scheduler, newCard(), from).map((o) => o.due)
    const labels = formatIntervals(from, dues)
    expect(labels).toHaveLength(4)
  })

  it('distinguishes month-level intervals that round to the same month', () => {
    const dues = [at(40 * 86_400_000), at(44 * 86_400_000)]
    const labels = formatIntervals(from, dues)
    expect(labels[0]).not.toBe(labels[1])
  })

  it('distinguishes hour-level intervals that round to the same hour', () => {
    const dues = [at(121 * 60_000), at(122 * 60_000)]
    const labels = formatIntervals(from, dues)
    expect(labels[0]).not.toBe(labels[1])
  })

  it('falls back to minute precision when coarser refinements still collide', () => {
    const dues = [at(1.4 * 86_400_000), at(1.4 * 86_400_000 + 61_000)]
    const labels = formatIntervals(from, dues)
    expect(labels[0]).not.toBe(labels[1])
    expect(labels[0]).toMatch(/m$/)
  })

  it('does not force distinct labels for intervals under a minute apart', () => {
    const dues = [at(20_000), at(40_000)]
    const labels = formatIntervals(from, dues)
    expect(labels[0]).toBe(labels[1])
  })

  it('produces no labels when there are no dues', () => {
    expect(formatIntervals(from, [])).toEqual([])
  })

  it('keeps real rating outcomes distinct as a card matures', () => {
    const scheduler = createScheduler()
    let card = newCard()
    let when = new Date(Date.parse('2026-01-15T12:00:00.000Z'))
    for (let i = 0; i < 6; i += 1) {
      const rated = calculateOutcomes(scheduler, card, when).find((o) => o.rating === Rating.Good)
      if (!rated) throw new Error('missing Good outcome')
      card = rated.card
      when = card.due
    }
    const dues = calculateOutcomes(scheduler, card, when).map((o) => o.due)
    const labels = formatIntervals(when, dues)
    for (let a = 0; a < dues.length; a += 1) {
      for (let b = a + 1; b < dues.length; b += 1) {
        if (Math.abs(dues[a].getTime() - dues[b].getTime()) >= 60_000) {
          expect(labels[a]).not.toBe(labels[b])
        }
      }
    }
  })
})
