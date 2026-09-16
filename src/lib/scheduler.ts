import { createEmptyCard, fsrs, Rating, type Card, type FSRS } from 'ts-fsrs'

export { Rating }

export function createScheduler(): FSRS {
  return fsrs()
}

export function newCard(): Card {
  return createEmptyCard()
}

export function scheduleCard(scheduler: FSRS, card: Card, rating: Rating): Card {
  const now = new Date()
  const scheduling = scheduler.repeat(card, now)
  const preview = (scheduling as unknown as Record<number, { card: Card }>)[rating]
  return preview.card
}

export function previewDues(scheduler: FSRS, card: Card): Record<number, Date> {
  const now = new Date()
  const scheduling = scheduler.repeat(card, now)
  const map = scheduling as unknown as Record<number, { card: Card }>
  return {
    [Rating.Again]: map[Rating.Again].card.due,
    [Rating.Hard]: map[Rating.Hard].card.due,
    [Rating.Good]: map[Rating.Good].card.due,
    [Rating.Easy]: map[Rating.Easy].card.due,
  }
}

export function formatInterval(from: Date, to: Date): string {
  const MIN = 60_000
  const HOUR = 3_600_000
  const DAY = 86_400_000
  const ms = to.getTime() - from.getTime()
  if (ms < MIN) return '<1m'
  if (ms < HOUR) return `${Math.round(ms / MIN)}m`
  if (ms < DAY) return `${Math.round(ms / HOUR)}h`
  const days = ms / DAY
  if (days < 30) return `${Math.round(days)}d`
  if (days < 365) return `${Math.round(days / 30.44)}mo`
  return `${Math.round(days / 365)}yr`
}

export function isDue(card: Card | undefined, now: Date): boolean {
  if (!card) return true
  return card.due.getTime() <= now.getTime()
}