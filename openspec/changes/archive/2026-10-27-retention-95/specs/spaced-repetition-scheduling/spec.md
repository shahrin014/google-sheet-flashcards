## MODIFIED Requirements

### Requirement: Single shared scheduler
The system SHALL use one scheduler instance, configured with a fixed 95% desired retention and otherwise default FSRS-6 parameters, for a study session, so that all cards in a session are scheduled under identical rules.

#### Scenario: Session with many cards
- GIVEN a deck of several cards
- WHEN each card is rated during the session
- THEN every outcome is computed by the same scheduler

#### Scenario: Fixed retention target
- GIVEN any card in a session
- WHEN its rating outcomes are computed
- THEN every outcome uses the 95% desired retention target

#### Scenario: Three successful Goods
- GIVEN a new card
- WHEN it is rated Good three times, each at its due time
- THEN the next rating preview reads `10m / 6d / 8d / 12d`
