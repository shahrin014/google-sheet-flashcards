## Why

The interval shown on a rating button and the interval actually applied when that rating is submitted come from two independent `scheduler.repeat` calls (`previewDues` vs `scheduleCard`), each taking its own `new Date()`. They are two sources of truth for "the answer duration", so what the learner sees is not guaranteed to be what they get. Separately, the shared formatter rounds to the nearest whole unit, so two genuinely different outcomes can both render `1d` (observed as the green Good and blue/indigo Easy buttons reading the same value), which makes the choice look arbitrary.

## What Changes

- **MODIFIES** the `spaced-repetition-scheduling` capability.
  - **ADDED** requirement: *Single answer-interval calculation* — one calculation, from one reference instant, produces the current card's rating outcomes; the label and the applied schedule both come from it.
  - **MODIFIED** requirement: *Rating interval preview* — intervals are taken from that single calculation.
  - **MODIFIED** requirement: *Interval formatting* — distinct intervals of the same card must read distinctly; equal intervals may share a label.
- **MODIFIES** the `study-session` capability.
  - **MODIFIED** requirement: *Rating interval labelling* — the button shows the exact interval the button applies.
- No `gsf.` localStorage keys are added, removed, or renamed, and no stored value changes shape — there is **no migration risk**.

## Impact

- Affected specs: `spaced-repetition-scheduling`, `study-session`.
- Affected code (see design.md): `src/lib/scheduler.ts`, `src/components/DeckProvider.tsx`.
- Tests: `src/lib/scheduler.test.ts` (extended), with `DeckProvider` behavior asserted through the pure `src/lib` layer.
