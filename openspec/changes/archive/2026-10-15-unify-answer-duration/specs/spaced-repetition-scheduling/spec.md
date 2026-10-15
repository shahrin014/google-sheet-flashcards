## ADDED Requirements

### Requirement: Single answer-interval calculation
The system SHALL compute the current card's four rating outcomes exactly once, from a single reference instant, and SHALL use that same calculation both to display each rating's interval and to schedule the card when a rating is submitted, so the interval shown is the interval applied.

#### Scenario: Shown interval equals applied interval
- GIVEN a revealed current card whose four rating intervals are displayed
- WHEN the learner submits one of those ratings
- THEN the card's new due time equals the due time the submitted label was derived from
- AND no interval is recomputed at submission time

#### Scenario: Reference instant is fixed while a card is current
- GIVEN a current card whose outcomes were computed when it became current
- WHEN the learner pauses before submitting a rating
- THEN the applied due time still corresponds to the displayed interval

#### Scenario: Reference instant advances with the next card
- GIVEN the current card has been rated and the next card is now current
- WHEN the next card's intervals are displayed
- THEN they are computed from a fresh reference instant

#### Scenario: No current card
- GIVEN no card is currently presented
- WHEN rating outcomes are requested
- THEN no rating outcomes are produced

## MODIFIED Requirements

### Requirement: Rating interval preview
For the currently presented card, the system SHALL show what interval each of the four ratings would produce, each interval taken from that card's single answer-interval calculation, so the learner rates with the exact consequence visible.

#### Scenario: Preview on a new card
- GIVEN a new card is the current card
- WHEN the rating options are rendered
- THEN each shows the interval its outcome would schedule

#### Scenario: Preview on a reviewed card
- GIVEN a card with existing scheduling state is the current card
- WHEN the rating options are rendered
- THEN each shows the interval from that card's current state

#### Scenario: No card presented
- GIVEN no card is currently presented
- WHEN rating previews are computed
- THEN no rating options are produced

### Requirement: Interval formatting
The system SHALL render a scheduling interval in the largest unit that keeps it readable — under a minute as `<1m`, then whole minutes, whole hours, whole days below 30, whole months below a year using 30.44 days per month, and whole years thereafter — and SHALL format the four intervals of the current card together so that distinct intervals read distinctly.

#### Scenario: Sub-minute interval
- GIVEN an interval shorter than one minute
- WHEN it is formatted
- THEN it reads `<1m`

#### Scenario: Minutes and hours
- GIVEN intervals of a few minutes and a few hours
- WHEN they are formatted
- THEN they read in minutes and hours respectively, rounded to whole units

#### Scenario: Days and months
- GIVEN an interval of a few days and an interval of a few months
- WHEN they are formatted
- THEN intervals under 30 days read in days and the rest read in months

#### Scenario: Long interval
- GIVEN an interval of more than a year
- WHEN it is formatted
- THEN it reads in years

#### Scenario: Distinct intervals are labelled distinctly
- GIVEN two of the current card's ratings produce different due times that differ by at least one minute
- WHEN their intervals are formatted together
- THEN the two labels differ

#### Scenario: Equal intervals may share a label
- GIVEN two of the current card's ratings produce the same due time
- WHEN their intervals are formatted together
- THEN the two labels may be identical
