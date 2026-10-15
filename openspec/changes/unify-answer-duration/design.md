## Context

The study surface shows each rating's resulting interval on its button. Today two things compute a due time:

- `previewDues(scheduler, card)` in `src/lib/scheduler.ts` — calls `scheduler.repeat(card, new Date())` once for the preview labels.
- `scheduleCard(scheduler, card, rating)` in `src/lib/scheduler.ts` — calls `scheduler.repeat(card, new Date())` again when the rating is submitted.

`DeckProvider.tsx` turns `previewDues` into labels with `formatInterval`, and applies `scheduleCard` on submit. The two calls use different instants and are independent, so the previewed interval and the applied interval can drift; and `formatInterval` rounds (`Math.round`) to the largest unit, so distinct intervals can collapse to the same label (verified with ts-fsrs 5.4.2: `Good`/`Easy` collide at `1mo`/`2mo` for high-stability cards and `7d`–`28d` in the relearning state; fuzz is disabled).

## Goals / Non-Goals

**Goals**

- One calculation per current card yields every rating's outcome (next due; where needed, next state).
- The two consumers — the button label and the submit handler — read that same calculation, so label == applied interval.
- Distinct intervals of the current card are labelled distinctly; equal intervals may share a label.

**Non-Goals**

- Changing the FSRS parameters, the four ratings, or the underlying scheduling math.
- Changing the scheduling formula's output — only *where and when* it is computed and *how* the interval is labelled.
- Redesigning the study UI or the rating colors.

## Decisions

1. **One reference instant per card.** Compute the four outcomes once, with a single `now`, and reuse them for both labelling and submission. The reference instant is chosen when a card becomes current and is refreshed only for the next card. This is what makes the shown interval the applied interval even if the learner pauses after revealing.
2. **Labels are formatted as a group, not one at a time.** Because distinctness is a property of the *set* of the card's intervals (a per-interval formatter cannot know its siblings), the formatting step takes all of the card's outcomes and returns the four labels. On a rounding collision between distinct intervals, resolve it deterministically (e.g. fall back to the next finer unit for the later label) so the labels stay non-decreasing.
3. **Lands in `src/lib/`.** The calculation and the group formatting are pure functions in `src/lib/scheduler.ts` (unit-testable, no DOM). `src/components/DeckProvider.tsx` only memoizes the result for the current card and passes labels to `Card.tsx`; `Card.tsx` needs no change.

## Risks / Trade-offs

- **Stale reference instant on a long-paused card.** If a learner reveals a card and returns hours later, the applied interval is computed from when the card became current, not when they rated. This is intentional (it is what the label promised) and matches the spec; the practical drift is bounded by the session.
- **Finer-unit labels on collision.** Resolving collisions may shorten the unit for one label (e.g. `1d` vs `1d 4h` instead of `1d`/`1d`). Accepted: a slightly noisier label beats two identical ones.
- **More work per card.** Computing four outcomes once per card is not more expensive than today's preview-every-render; it may be *cheaper* since submission no longer recomputes.

## Migration Plan

No stored data changes. `gsf.` keys and their shapes are untouched, so no migration is required; existing decks load unchanged.

## Open Questions

- None blocking. Exact collision-resolution format (finer unit vs a suffix) is a design detail to settle during implementation, constrained by "non-decreasing and distinct for distinct intervals".
