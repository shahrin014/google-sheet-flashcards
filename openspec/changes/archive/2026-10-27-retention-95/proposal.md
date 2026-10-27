## Why

The app used `ts-fsrs`'s default 90% desired retention. After three successful `Good` ratings, the next preview reached month-scale intervals (`10m / 1mo / 2mo / 3mo`), which felt too aggressive for the intended use. Raising the fixed retention target to 95% keeps intervals more conservative without adding a tuning UI.

## What Changes

- **MODIFIES** the `spaced-repetition-scheduling` capability.
  - **MODIFIED** requirement: *Single shared scheduler* — the scheduler is configured with a fixed 95% desired retention (instead of the `ts-fsrs` 90% default) and otherwise default parameters.
- No `gsf.` localStorage keys are added, removed, or renamed; existing progress and due dates are preserved. Future scheduling uses the new retention target.

## Impact

- Affected specs: `spaced-repetition-scheduling`.
- Affected code: `src/lib/scheduler.ts` (`REQUEST_RETENTION = 0.95`, `fsrs({ request_retention: REQUEST_RETENTION })`).
- Tests: `src/lib/scheduler.test.ts` updated for the 95% three-Good progression.
- Docs: `README.md`, `docs/scheduling.md`.
