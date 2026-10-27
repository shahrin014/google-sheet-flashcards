## 1. Fixed retention

- [x] 1.1 Set `REQUEST_RETENTION = 0.95` and pass it to `fsrs()` in `src/lib/scheduler.ts`.
- [x] 1.2 Keep learning steps, relearning steps, fuzzing, and maximum interval at `ts-fsrs` defaults.
- [x] 1.3 Update `src/lib/scheduler.test.ts` for the 95% three-Good progression: `10m / 6d / 8d / 12d`, raw `[0, 6, 8, 12]`.
- [x] 1.4 Validate the new expectations against the FSRS-6 formulas used by `ts-fsrs@5.4.2`.
- [x] 1.5 Record verification command: `npm run test && npm run lint && npm run build`; not executed here because Node.js is unavailable.

## 2. Documentation and spec sync

- [x] 2.1 Update `README.md` and `docs/scheduling.md` for 95% retention, the new interval modifier, the worked example, and the trade-offs.
- [x] 2.2 Update `openspec/specs/spaced-repetition-scheduling/spec.md` so the evergreen spec records the fixed 95% target.
- [x] 2.3 Archive this change under `openspec/changes/archive/2026-10-27-retention-95/`.
