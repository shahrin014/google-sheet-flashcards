# Scheduling algorithm

Sheet Flashcards delegates scheduling to [`ts-fsrs`](https://github.com/open-spaced-repetition/fsrs-ts) **5.4.2**, which implements **FSRS-6**. The app fixes one parameter: **desired retention is 95%** (the `ts-fsrs` default is 90%). Everything else uses the library defaults. This document records the configuration, the formulas that produce each rating's due time, and how the due time becomes the label on the rating button.

## Fixed configuration

| Setting | Value | Notes |
| --- | --- | --- |
| Requested retention | `0.95` (95%) | Higher than the `ts-fsrs` default of 90%; intervals target 95% recall. |
| Maximum interval | `36500` days | ~100 years. |
| Fuzzing | off | Intervals are deterministic. |
| Short-term scheduling | on | Uses `BasicScheduler`, which includes learning/relearning steps. |
| Learning steps | `1m`, `10m` | Applied while a card is `New` or `Learning`. |
| Relearning steps | `10m` | Applied while a card is `Relearning` (after `Again` on a `Review` card). |
| Weights | FSRS-6 defaults | `ts-fsrs` `default_w`, reproduced below. |

The default weight vector (`w[0]` … `w[20]`) used by `ts-fsrs@5.4.2` is:

```text
0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001,
1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014,
1.8729, 0.5425, 0.0912, 0.0658, 0.1542
```

Retention is a code-level constant (`REQUEST_RETENTION` in `src/lib/scheduler.ts`), not a user setting. It is not part of the deck key, so changing it keeps existing progress; stored due dates remain in place until each card is reviewed again.

## Card state

FSRS stores two memory variables per card:

- **Stability `S`** — the interval, in days, at which recall probability is 90%. FSRS defines stability at 90%; the app's 95% desired-retention setting then shortens the actual interval via `intervalModifier`.
- **Difficulty `D`** — a value from 1 (easy) to 10 (hard).

It also stores the schedule state (`New`, `Learning`, `Review`, `Relearning`), the due time, `last_review`, the current learning-step index, and review counters (`reps`, `lapses`).

## One reference instant

When a card becomes current, `DeckProvider` computes all four outcomes once with a single `now`:

```ts
const studyInstant = useMemo(() => ({ currentId, now: new Date() }), [currentId])
const outcomes = calculateOutcomes(scheduler, card, referenceNow)
```

Those same four outcomes supply both the button labels and the card stored when a rating is submitted. The displayed interval is therefore the applied interval even if the learner pauses before rating. The instant is refreshed only when the next card becomes current.

## Time and retrievability

Elapsed time is measured in whole days:

```text
t = floor((now - last_review) / 1 day)
```

Same-day reviews therefore use `t = 0`. Retrievability at review time is:

```text
R(t, S) = (1 + factor * t / S) ^ decay
```

with

```text
decay  = -w[20] = -0.1542
factor = exp((1 / decay) * ln(0.9)) - 1 ≈ 0.98034649
```

## Interval from stability

The long-term interval is:

```text
intervalModifier = (request_retention ^ (1 / decay) - 1) / factor
                 = (0.95 ^ (1 / decay) - 1) / factor
                 ≈ 0.40256
interval = min(max(1, round(S * intervalModifier)), 36500)
```

With 95% desired retention, `intervalModifier` is about `0.40256`, so intervals are roughly 40% of the card's stability. Fuzzing is off, so `interval` is deterministic.

## Rating paths

The four ratings are **Again**, **Hard**, **Good**, and **Easy**. `Again` is not calculated like the other three on a `Review` card: it sends the card back to the 10-minute relearning step, while `Hard`/`Good`/`Easy` schedule a future review.

### Review card: Hard / Good / Easy

For a successful recall (`t > 0`), the new stability is:

```text
S' = S * (
  1
  + exp(w[8])
  * (11 - D)
  * S ^ (-w[9])
  * (exp((1 - R) * w[10]) - 1)
  * (w[15] if Hard else 1)
  * (w[16] if Easy else 1)
)
```

`S'` is clamped to `[0.001, 36500]`. The new interval is then `round(S' * intervalModifier)`.

The three intervals are forced to be strictly ordered:

```text
hard = min(hard, good)
good = max(good, hard + 1)
easy = max(easy, good + 1)
```

Independently of the stability path, difficulty is updated for every rating (including `Again`):

```text
deltaD = -w[6] * (rating - 3)
nextD  = D + deltaD * (10 - D) / 9
D'     = clamp(w[7] * initD(Easy) + (1 - w[7]) * nextD, 1, 10)
```

where

```text
initD(rating) = w[4] - exp((rating - 1) * w[5]) + 1
```

### Review card: Again

`Again` means the card was forgotten:

- The card enters `Relearning` and is due after the **10-minute** relearning step.
- `lapses` is incremented.
- Stability after failure is:

```text
S_fail = clamp(
  w[11] * D ^ (-w[12]) * ((S + 1) ^ w[13] - 1) * exp((1 - R) * w[14]),
  0.001,
  36500
)

S' = clamp(S / exp(w[17] * w[18]), 0.001, S_fail)
```

For the worked-example card (`S ≈ 7.32d`, `D ≈ 2.10`), this drops stability to ~1.15 days and raises difficulty to ~7.39. When the card returns after 10 minutes, its preview is typically `10m / 15m / 1d / 1d`.

### New and Learning cards

A `New` card has `S = 0` and `D = 0`; its first rating initializes them:

```text
initS(rating) = max(w[rating - 1], 0.1)
initD(rating) = w[4] - exp((rating - 1) * w[5]) + 1
```

The learning-step strategy then decides the due time:

| State | Again | Hard | Good | Easy |
| --- | --- | --- | --- | --- |
| `New` | `1m` | `6m` | `10m` | `Review`, ~`3d` |
| `Learning` | `1m` | `6m` | next step, or `Review` after the last step | `Review` |
| `Review` | `10m` relearning | `Review` via FSRS | `Review` via FSRS | `Review` via FSRS |
| `Relearning` | `10m` | `15m` | `Review` via FSRS | `Review` via FSRS |

For a new card the four buttons therefore read `1m / 6m / 10m / 3d`. `Hard` is the midpoint of the two learning steps, and `Easy` skips the remaining steps.

When a learning or relearning step is the last step, `Good`/`Easy` move the card to `Review`. If the review happens the same day (`t = 0`), the stability update uses the short-term formula rather than the long-term recall/failure formulas:

```text
sinc = S ^ (-w[19]) * exp(w[17] * (rating - 3 + w[18]))
sinc = max(sinc, 1) for Hard/Good/Easy
S'   = clamp(S * sinc, 0.001, 36500)
```

## Interval labels

`formatIntervals` formats the card's four intervals as a group so distinct intervals do not collapse to the same label.

It first tries a coarse label:

| Duration | Label |
| --- | --- |
| `< 1 minute` | `<1m` |
| `< 1 hour` | rounded minutes, e.g. `10m` |
| `< 1 day` | rounded hours, e.g. `2h` |
| `< 30 days` | rounded days, e.g. `8d` |
| `< 365 days` | rounded months using 30.44 days/month, e.g. `1mo` |
| `>= 365 days` | rounded years using 365 days/year, e.g. `1yr` |

Distinct month-scale intervals therefore read as `1mo`, `2mo`, `3mo`, and so on. If two intervals that differ by at least one minute get the same coarse label, the formatter retries with a more detailed format (`1mo 12d`, `2h 30m`, …). If that still collides, it retries with whole minutes. Intervals less than a minute apart may share a label.

## Worked example: three successful Goods

Starting from a new card and rating `Good` three times, with each review at the due time:

| When the card is shown | State | Stability | Preview on the buttons | Pressing Good leads to |
| --- | --- | --- | --- | --- |
| First time (new) | `New` | 0 | `1m / 6m / 10m / 3d` | `Learning`, due +10m |
| Again after 10m | `Learning` | 2.31d | `1m / 6m / 1d / 2d` | `Review`, due +1d |
| Again after 1d | `Review` | 2.31d | `10m / 2d / 3d / 5d` | `Review`, due +3d |
| Again after 3d | `Review` | 7.32d | `10m / 6d / 8d / 12d` | `Review`, due +8d |

When that last card comes due after the third Good, its raw intervals are:

```text
Again: 10 minutes
Hard:  6 days
Good:  8 days
Easy:  12 days
```

`Again` stays at the 10-minute relearning step while the other three move to days. `Again` means "show it again soon", while `Hard`/`Good`/`Easy` schedule the next long-term review. The 95% retention setting is deliberately more conservative than the `ts-fsrs` default: at 90%, the same card would show `10m / 1mo / 2mo / 3mo`. The regression test in `src/lib/scheduler.test.ts` (`shows the expected intervals after three successful Goods`) locks in the 95% progression.

## Where the code lives

- `src/lib/scheduler.ts` — scheduler construction, outcome calculation, interval formatting.
- `src/components/DeckProvider.tsx` — one reference instant per current card; labels and submission share the same outcomes.
- `src/lib/scheduler.test.ts` — regression tests, including the three-Good progression and interval-collision cases.
