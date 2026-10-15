## 1. Single interval calculation (src/lib/scheduler.ts)

- [x] 1.1 Add one function that, given the scheduler, a card, and a single reference instant, returns each rating's next due (and next state where needed); keep `newCard`/`createScheduler` unchanged.
- [x] 1.2 Remove `previewDues` and `scheduleCard` as independent `repeat` call sites; expose the rating outcome derived from the single calculation instead.
- [x] 1.3 Test in `src/lib/scheduler.test.ts`: same reference instant gives a previewed due that equals the applied due; a paused card keeps the due computed for its reference instant; the next card computes from a fresh instant.
- [x] 1.4 Verify: `npm run test && npm run lint && npm run build`.

## 2. Collision-free labelling (src/lib/scheduler.ts, src/components/DeckProvider.tsx)

- [x] 2.1 Format the four outcomes of the current card as a group so distinct intervals get distinct, non-decreasing labels; equal intervals may share a label.
- [x] 2.2 In `src/components/DeckProvider.tsx`, compute the card's outcomes once per current card (memoized) and feed both the button labels and the submit handler from it, so submits never recompute.
- [x] 2.3 Test in `src/lib/scheduler.test.ts`: Good/Easy collisions that previously both rendered the same unit (e.g. `1mo`/`2mo` at high stability; `7d`–`28d` in relearning) now render distinct labels, while two equal outcomes render equal labels.
- [x] 2.4 Verify: `npm run test && npm run lint && npm run build`.

## 3. Spec sync

- [x] 3.1 Run OpenSpec validation (or manual review) that the deltas apply cleanly onto `openspec/specs/spaced-repetition-scheduling/spec.md` and `openspec/specs/study-session/spec.md`.
- [x] 3.2 On archive, fold the deltas into the two capability specs and move this change to `openspec/changes/archive/`.
