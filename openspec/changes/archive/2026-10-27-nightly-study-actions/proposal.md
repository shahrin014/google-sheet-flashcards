## Why

On narrow screens the four rating buttons sit below the card, so the learner must scroll after revealing. The current flat colors also make the ratings harder to scan.

## What Changes

- **MODIFIES** the `study-session` capability.
  - **ADDED** requirement: *Persistent rating bar* — revealed cards show the four ratings in a fixed bottom bar.
  - **ADDED** requirement: *Single-row rating grid* — four actions stay in one row, with fluid text that shrinks instead of wrapping.
  - **ADDED** requirement: *Rating color hierarchy* — each rating has a distinct, readable accent color in light and dark mode.
- No `gsf.` storage keys or stored data change.

## Impact

- Affected specs: `study-session`.
- Affected code: `src/components/Card.tsx`, `src/App.css`, `src/index.css`.
