import { useEffect } from 'react'
import { Rating } from '../lib/scheduler'

interface Props {
  front: string
  back: string
  tags: string[]
  revealed: boolean
  isNew: boolean
  onReveal: () => void
  onRate: (rating: Rating) => void
}

const RATINGS: { rating: Rating; label: string; key: string }[] = [
  { rating: Rating.Again, label: 'Again', key: '1' },
  { rating: Rating.Hard, label: 'Hard', key: '2' },
  { rating: Rating.Good, label: 'Good', key: '3' },
  { rating: Rating.Easy, label: 'Easy', key: '4' },
]

export default function Card({ front, back, tags, revealed, isNew, onReveal, onRate }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.repeat) return
      const code = e.key
      if (code === ' ' || code === 'Enter') {
        e.preventDefault()
        if (!revealed) onReveal()
      } else if (revealed && ['1', '2', '3', '4'].includes(code)) {
        onRate(RATINGS[Number(code) - 1].rating)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [revealed, onReveal, onRate])

  return (
    <section className="card-stage" onClick={!revealed ? onReveal : undefined}>
      {tags.length > 0 && (
        <div className="tags">
          {tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className={`flashcard ${revealed ? 'revealed' : ''}`}>
        <div className="flashcard-face front">
          <div className="content">{front}</div>
        </div>
        <div className="flashcard-face back">
          {isNew ? <span className="badge">New</span> : null}
          <div className="content">{back}</div>
        </div>
      </div>

      <p className="hint">
        {revealed ? 'Press 1–4 or click a button to rate' : 'Click or press space to reveal'}
      </p>

      {revealed && (
        <div className="ratings">
          {RATINGS.map(({ rating, label, key }) => (
            <button key={rating} className={`rate rate-${rating}`} onClick={() => onRate(rating)}>
              <kbd>{key}</kbd>
              {label}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}