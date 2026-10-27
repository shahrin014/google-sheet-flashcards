## 1. Rating bar

- [x] 1.1 Render the four ratings in a fixed bottom bar after reveal, with number key, rating name, and interval.
- [x] 1.2 Reserve bottom space so the bar does not cover the card.
- [x] 1.3 Keep the four actions in a single-row grid; shrink long labels instead of wrapping.

## 2. Color and polish

- [x] 2.1 Add distinct light/dark accent tokens for Again, Hard, Good, and Easy.
- [x] 2.2 Style the buttons, flashcard, and page background with the new palette.
- [x] 2.3 Preserve keyboard and focus behavior.

## 3. Spec sync and verification

- [x] 3.1 Fold the new requirements into `openspec/specs/study-session/spec.md`.
- [x] 3.2 Archive this change under `openspec/changes/archive/2026-10-27-nightly-study-actions/`.
- [x] 3.3 Verify: `npm run test && npm run lint && npm run build`.
