import { useEffect } from 'react'
import { Badge, Group, Kbd, Paper, Text } from '@mantine/core'
import { Rating } from '../lib/scheduler'

interface CardSection {
  label: string
  value: string
}

interface Props {
  front: CardSection[]
  back: CardSection[]
  tags: string[]
  revealed: boolean
  isNew: boolean
  ratings: { rating: Rating; label: string }[]
  onReveal: () => void
  onRate: (rating: Rating) => void
}

const RATING_NAMES: Record<number, string> = {
  [Rating.Again]: 'Again',
  [Rating.Hard]: 'Hard',
  [Rating.Good]: 'Good',
  [Rating.Easy]: 'Easy',
}

const RATING_KEYS: Record<number, string> = {
  [Rating.Again]: 'again',
  [Rating.Hard]: 'hard',
  [Rating.Good]: 'good',
  [Rating.Easy]: 'easy',
}

export default function Card({
  front,
  back,
  tags,
  revealed,
  isNew,
  ratings,
  onReveal,
  onRate,
}: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.repeat) return
      const code = e.key
      if (code === ' ' || code === 'Enter') {
        e.preventDefault()
        if (!revealed) onReveal()
      } else if (revealed && ['1', '2', '3', '4'].includes(code)) {
        onRate(ratings[Number(code) - 1].rating)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [revealed, ratings, onReveal, onRate])

  function renderSections(sections: CardSection[]) {
    return (
      <div className="item-list">
        {sections.map(({ label, value }) => (
          <div key={label} className="item">
            <span className="item-label">{label}</span>
            <span className="item-value">{value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <section className="card-stage">
      {tags.length > 0 && (
        <Group gap="xs">
          {tags.map((t) => (
            <Badge key={t} variant="light" color="indigo">
              {t}
            </Badge>
          ))}
        </Group>
      )}

      <Paper
        shadow="md"
        radius="lg"
        withBorder
        className={`flashcard ${revealed ? 'revealed' : ''}`}
        onClick={!revealed ? onReveal : undefined}
      >
        {revealed && isNew && (
          <Badge variant="light" color="green" className="new-badge">
            New
          </Badge>
        )}
        {revealed ? renderSections(back) : renderSections(front)}
      </Paper>

      {!revealed && (
        <Text size="sm" c="dimmed" className="study-hint">
          Click the card or press <Kbd>Space</Kbd> to reveal
        </Text>
      )}

      {revealed && (
        <div className="rating-bar">
          <div className="rating-bar-inner">
            <div className="rating-bar-head">
              <span>Rate this card</span>
              <span className="rating-bar-hint">Keys 1–4</span>
            </div>
            <div className="rating-grid">
              {ratings.map(({ rating, label }, i) => {
                const name = RATING_NAMES[rating]
                return (
                  <button
                    key={rating}
                    type="button"
                    className={`rating-button rating-${RATING_KEYS[rating]}`}
                    title={`${name} — ${label}`}
                    aria-label={`${name}: ${label}`}
                    onClick={() => onRate(rating)}
                  >
                    <span className="rating-key" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="rating-name">{name}</span>
                    <span className="rating-interval">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}