import { createEmptyCard, fsrs, Rating, type Card, type FSRS } from 'ts-fsrs'

export { Rating }

const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000

const RATING_ORDER = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as const

export interface RatingOutcome {
  rating: Rating
  due: Date
  card: Card
}

export function createScheduler(): FSRS {
  return fsrs()
}

export function newCard(): Card {
  return createEmptyCard()
}

export function calculateOutcomes(scheduler: FSRS, card: Card, now: Date): RatingOutcome[] {
  const scheduling = scheduler.repeat(card, now)
  const map = scheduling as unknown as Record<number, { card: Card }>
  return RATING_ORDER.map((rating) => {
    const next = map[rating].card
    return { rating, due: next.due, card: next }
  })
}

function formatCoarse(ms: number): string {
  if (ms < MINUTE) return '<1m'
  if (ms < HOUR) return `${Math.round(ms / MINUTE)}m`
  if (ms < DAY) return `${Math.round(ms / HOUR)}h`
  const days = ms / DAY
  if (days < 30) return `${Math.round(days)}d`
  if (days < 365) return `${Math.round(days / 30.44)}mo`
  return `${Math.round(days / 365)}yr`
}

function formatDetailed(ms: number): string {
  if (ms < MINUTE) return '<1m'
  if (ms < HOUR) return `${Math.round(ms / MINUTE)}m`
  if (ms < DAY) {
    const hours = Math.floor(ms / HOUR)
    const minutes = Math.round((ms - hours * HOUR) / MINUTE)
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  const days = ms / DAY
  if (days < 365) {
    if (days < 30.44) {
      const whole = Math.floor(days)
      const hours = Math.round((days - whole) * 24)
      return hours > 0 ? `${whole}d ${hours}h` : `${whole}d`
    }
    const months = Math.floor(days / 30.44)
    const remainder = Math.round(days - months * 30.44)
    return remainder > 0 ? `${months}mo ${remainder}d` : `${months}mo`
  }
  const years = Math.floor(days / 365)
  const remainder = Math.round((days - years * 365) / 30.44)
  return remainder > 0 ? `${years}yr ${remainder}mo` : `${years}yr`
}

function formatMinutes(ms: number): string {
  if (ms < MINUTE) return '<1m'
  return `${Math.round(ms / MINUTE)}m`
}

const INTERVAL_FORMATTERS = [formatCoarse, formatDetailed, formatMinutes] as const

export function formatInterval(from: Date, to: Date): string {
  return formatCoarse(to.getTime() - from.getTime())
}

function labelsAreDistinct(durations: number[], labels: string[]): boolean {
  for (let a = 0; a < durations.length; a += 1) {
    for (let b = a + 1; b < durations.length; b += 1) {
      if (Math.abs(durations[a] - durations[b]) >= MINUTE && labels[a] === labels[b]) {
        return false
      }
    }
  }
  return true
}

export function formatIntervals(from: Date, dues: Date[]): string[] {
  const durations = dues.map((due) => due.getTime() - from.getTime())
  for (const formatter of INTERVAL_FORMATTERS) {
    const labels = durations.map((ms) => formatter(ms))
    if (labelsAreDistinct(durations, labels)) return labels
  }
  return durations.map((ms) => formatMinutes(ms))
}

export function isDue(card: Card | undefined, now: Date): boolean {
  if (!card) return true
  return card.due.getTime() <= now.getTime()
}
