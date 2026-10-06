# Deck Composition Specification

## Purpose
Turning sheet rows into the concrete set of flashcards a session studies: which rows are eligible, what stable identity each card carries so progress survives edits to the sheet, and in what order those cards are offered.

## Requirements

### Requirement: Stable card identity
The system SHALL assign every card an identity that stays the same across sheet reloads and unrelated edits, so that scheduling state can be reattached to the same card.

#### Scenario: ID column configured and populated
- GIVEN a configuration whose ID column is set
- AND a row whose ID cell holds a non-empty value
- WHEN the row becomes a card
- THEN its identity is derived from the ID column's name and that value

#### Scenario: ID column configured but cell empty
- GIVEN a configuration whose ID column is set
- AND a row whose ID cell is empty
- WHEN the row becomes a card
- THEN its identity falls back to a hash of the row's position in the sheet

#### Scenario: No ID column configured
- GIVEN a configuration with no ID column
- WHEN rows become cards
- THEN each identity is a hash of the row's values across the union of the selected front and back columns
- AND rows that do not repeat an ID remain distinguishable from each other

#### Scenario: Editing a row's text
- GIVEN a deck built without an ID column
- WHEN the user edits a row's front or back text in the sheet and it is reloaded
- THEN that edit produces a different card identity rather than mutating the existing card's scheduling state

### Requirement: Row eligibility
The system SHALL admit a row as a card only when at least one selected front column and at least one selected back column both hold a non-empty value. Rows failing either side SHALL be excluded from the deck.

#### Scenario: Row with content on both sides
- GIVEN a row with a non-empty front cell and a non-empty back cell
- WHEN the deck is built
- THEN the row becomes a card

#### Scenario: Row with no front content
- GIVEN a row whose every selected front column is empty or whitespace
- WHEN the deck is built
- THEN the row is excluded

#### Scenario: Row with no back content
- GIVEN a row whose every selected back column is empty or whitespace
- WHEN the deck is built
- THEN the row is excluded

#### Scenario: Partial content on one side is sufficient
- GIVEN a row where only one of three selected front columns has a value, and one back column has a value
- WHEN the deck is built
- THEN the row becomes a card

### Requirement: Progress preservation across sheet edits
The system SHALL carry a card's existing scheduling state forward whenever its identity reappears after a reload, so that editing or adding rows in the sheet never resets study progress.

#### Scenario: Row unchanged across reloads
- GIVEN a card that has been reviewed
- WHEN the sheet is reloaded and the deck rebuilt
- THEN that card retains its scheduling state and due date

#### Scenario: Newly added row
- GIVEN a rebuilt deck whose source sheet has gained a row not present before
- WHEN the deck is built
- THEN the new row becomes a card in the new state

#### Scenario: Row removed from the sheet
- GIVEN a card whose row no longer exists in the sheet
- WHEN the deck is rebuilt
- THEN the card is absent from the session

### Requirement: Shuffled study order
The system SHALL present eligible cards in a randomized order, reshuffling each time the deck is built, so that repeated sessions do not follow the sheet's row order.

#### Scenario: Deck built from a sheet
- GIVEN a sheet with several eligible rows
- WHEN the deck is built
- THEN the resulting card order is a shuffle of the eligible rows rather than the sheet's row order

#### Scenario: Shuffle preserves the deck
- GIVEN a deck built from a sheet
- WHEN the order is inspected
- THEN every card in the order corresponds to a row, and each card still resolves to the correct row content

### Requirement: Deck identity scoped to the configuration
The system SHALL identify a deck by the combination of its lowercased sheet URL and its selected columns, so that changing the sheet or the column mapping yields a distinct deck with independent progress rather than silently reusing another deck's state.

#### Scenario: Same sheet and same mapping
- GIVEN a configuration that has been studied before
- WHEN the identical configuration is opened again
- THEN the same deck, and its progress, is loaded

#### Scenario: Column mapping changed
- GIVEN a deck whose front columns were selected
- WHEN a configuration with different front columns is opened
- THEN a different deck is used, whose progress is separate

#### Scenario: Sheet URL casing differs
- GIVEN a deck configured for a sheet URL
- WHEN the same URL is supplied with different letter casing
- THEN the same deck is used

### Requirement: Deck rebuild trigger
The system SHALL rebuild the deck whenever the configuration or the fetched sheet changes, and SHALL persist the rebuilt deck. After a progress reset the system SHALL rebuild from the sheet again so that all cards return to the new state.

#### Scenario: Configuration changes mid-session
- GIVEN an open study session
- WHEN the configuration changes
- THEN the deck is rebuilt for the new configuration

#### Scenario: Sheet edited externally
- GIVEN an open study session with a stored configuration
- WHEN the sheet is reloaded from the network
- THEN the deck is rebuilt against the newly fetched rows