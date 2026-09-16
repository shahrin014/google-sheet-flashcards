import { useEffect } from 'react'
import { Badge, Button, Group, Kbd, Paper, Text } from '@mantine/core'
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

const RATING_COLORS: Record<number, string> = {
  [Rating.Again]: 'red',
  [Rating.Hard]: 'orange',
  [Rating.Good]: 'green',
  [Rating.Easy]: 'indigo',
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

      <Text size="sm" c="dimmed">
        {revealed ? (
          <>
            Press <Kbd>1</Kbd>–<Kbd>4</Kbd> or click a button to rate
          </>
        ) : (
          <>
            Click the card or press <Kbd>Space</Kbd> to reveal
          </>
        )}
      </Text>

      {revealed && (
        <Group gap="sm">
          {ratings.map(({ rating, label }, i) => (
            <Button
              key={rating}
              color={RATING_COLORS[rating]}
              variant="light"
              size="lg"
              leftSection={<Kbd>{String(i + 1)}</Kbd>}
              title={RATING_NAMES[rating]}
              onClick={() => onRate(rating)}
            >
              {label}
            </Button>
          ))}
        </Group>
      )}
    </section>
  )
}