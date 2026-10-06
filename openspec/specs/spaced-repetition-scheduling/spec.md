# Spaced Repetition Scheduling Specification

## Purpose
Deciding which cards are due, what each rating outcome costs the learner in time, and when a rated card returns. Wraps the FSRS scheduler so every session shares one schedule and every review is recorded.

## Requirements

### Requirement: Single shared scheduler
The system SHALL use one scheduler instance, configured with default parameters, for a study session, so that all cards in a session are scheduled under identical rules.

#### Scenario: Session with many cards
- GIVEN a deck of several cards
- WHEN each card is rated during the session
- THEN every outcome is computed by the same scheduler

### Requirement: New card creation
The system SHALL represent a card that has never been reviewed as a new card, with no history, so that its first rating starts its schedule from scratch.

#### Scenario: Card with no prior state
- GIVEN a card created for a newly added sheet row
- WHEN its state is inspected
- THEN it is in the new state and has a due time that makes it immediately presentable

### Requirement: Rating application
When a card is rated, the system SHALL produce the card's next state and due time from the rating, evaluated at the moment of rating, and SHALL make the card unavailable for the remainder of the session unless its new due time has already passed.

#### Scenario: Rating a card
- GIVEN a revealed card
- WHEN the user submits a rating
- THEN the card's scheduling state and due time are updated from that rating
- AND the card is no longer the current card

#### Scenario: Rating requires a current card
- GIVEN no card is currently presented
- WHEN a rating is submitted
- THEN nothing changes

### Requirement: Due-card queue
The system SHALL present the first due card in the deck's shuffled order, treating a card with no scheduling state as due and a card as due once its due time has been reached.

#### Scenario: Card with no state
- GIVEN a card that has never been reviewed
- WHEN due cards are computed
- THEN the card is included

#### Scenario: Card due in the future
- GIVEN a card whose due time is later than the current time
- WHEN due cards are computed
- THEN the card is excluded

#### Scenario: Card due exactly now
- GIVEN a card whose due time equals the current time
- WHEN due cards are computed
- THEN the card is included

#### Scenario: Ordering
- GIVEN a deck whose shuffled order contains several due cards
- WHEN the current card is chosen
- THEN it is the earliest due card in that shuffled order

### Requirement: Rating interval preview
For the currently presented card, the system SHALL show what interval each of the four ratings would produce, so the learner rates with the consequence visible.

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
The system SHALL render a scheduling interval in the largest unit that keeps it readable: under a minute as `<1m`, then whole minutes, whole hours, whole days below 30, whole months below a year using 30.44 days per month, and whole years thereafter.

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

### Requirement: Review logging
The system SHALL append a log entry for every rating, capturing the card identity, the rating, the review timestamp, and the resulting due time, so the learner can see how many cards were reviewed today.

#### Scenario: Logging a rating
- GIVEN a rated card
- WHEN the rating is applied
- THEN one log entry is appended for that card
- AND the entry records the card identity, the rating, the review time, and the new due time

#### Scenario: Counting today's reviews
- GIVEN log entries spanning several days
- WHEN the reviewed-today count is computed
- THEN only entries whose review date falls on the current day are counted

#### Scenario: Logs survive deck rebuilds
- GIVEN a deck with accumulated log entries
- WHEN the deck is rebuilt from a reloaded sheet
- THEN the log entries are retained

### Requirement: New-card counting
The system SHALL report how many cards in the deck remain in the new state, so the learner can see how much unseen material is left.

#### Scenario: Counting after ratings
- GIVEN a deck containing new and previously reviewed cards
- WHEN the new-card count is computed
- THEN it equals the number of deck cards still in the new state
- AND it decreases as new cards are rated