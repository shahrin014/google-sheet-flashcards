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

export function isDue(card: Card | undefined, now: Date): boolean {
  if (!card) return true
  return card.due.getTime() <= now.getTime()
}