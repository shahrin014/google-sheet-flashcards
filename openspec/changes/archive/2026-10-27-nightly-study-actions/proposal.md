## Why

On narrow screens the four rating buttons sit below the card, so the learner must scroll after revealing. The current flat colors also make the ratings harder to scan.

## What Changes

- **MODIFIES** the `study-session` capability.
  - **ADDED** requirement: *Fixed rating bar* — revealed cards show the four ratings in a bottom-fixed bar.
  - **ADDED** requirement: *Rating bar readability* — one row, fluid labels, and distinct light/dark colors.
- No `gsf.` storage keys or stored data change.

## Impact

- Affected specs: `study-session`.
- Affected code: `src/components/Card.tsx`, `src/App.css`, `src/index.css`.
