## Context

FSRS-6's desired-retention parameter controls how long intervals grow. The `ts-fsrs` default is `0.90`. The app previously called `fsrs()` with no parameters, so it used that default. After three successful `Good` ratings, a card reached about 11 days of stability and the next preview showed `10m / 1mo / 2mo / 3mo`.

## Goals / Non-Goals

**Goals**

- Use a fixed 95% desired retention for every card in a session.
- Keep one scheduler per session.
- Preserve existing deck state and due dates.
- Avoid adding a retention-tuning UI.

**Non-Goals**

- Exposing retention in settings, presets, URL parameters, or the UI.
- Changing learning steps, relearning steps, weights, fuzzing, or the maximum interval.
- Rescheduling existing cards immediately.

## Decisions

1. **Code-level constant.** `REQUEST_RETENTION = 0.95` is defined in `src/lib/scheduler.ts` and passed to `fsrs({ request_retention: REQUEST_RETENTION })`. A single constant keeps the configuration auditable and makes the fixed target explicit.
2. **No deck-key change.** Retention is global and is not part of `deckKey`, so existing progress is preserved. Stored due dates remain in place until each card is reviewed; the new target affects subsequent intervals.
3. **95%, not 97%.** 95% is a common conservative target and roughly doubles or triples the review load for mature cards compared with 90%. 97% remains available by changing the constant but is intentionally not the default.

## Risks / Trade-offs

- **More reviews per card.** Accepted: the change is meant to reduce lapses and make intervals feel safer.
- **Existing scheduled cards are not rescheduled immediately.** Accepted: avoids rewriting stored due dates and matches how a retention change normally applies.
- **No per-deck control.** Accepted: the user explicitly asked for no tuning UI.
