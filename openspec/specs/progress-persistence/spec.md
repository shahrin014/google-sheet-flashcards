# Progress Persistence Specification

## Purpose
Storing and restoring everything the learner would otherwise lose between visits: the active configuration, per-deck scheduling state, presets, and review history. All of it lives in the browser, under a reserved and versioned key namespace, with explicit rules for corruption, migration, and erasure.

## Requirements

### Requirement: Browser-local storage only
The system SHALL persist all user data in browser local storage. It MUST NOT require a server, a database, an account, or an API key. The sheet's own sharing permissions SHALL be the only access control.

#### Scenario: No network round-trip for progress
- GIVEN a learner who has reviewed cards
- WHEN the app is reloaded
- THEN progress is restored entirely from local storage

#### Scenario: No credentials configured
- GIVEN a first-time user
- WHEN the app runs
- THEN no sign-in, token, or key is requested

### Requirement: Reserved key namespace
Every key the app writes SHALL begin with `gsf.`, and keys that describe stored data SHALL carry a version suffix, so that unrelated keys on the same origin are never touched and future formats can be introduced alongside old ones.

#### Scenario: All app keys are namespaced
- GIVEN any setting, preset, or deck the app stores
- WHEN its storage key is inspected
- THEN the key begins with `gsf.`

#### Scenario: Stored data is versioned
- GIVEN settings, presets, the active preset, and each deck
- WHEN their storage keys are inspected
- THEN each carries its version suffix

#### Scenario: Deck storage is keyed per configuration
- GIVEN two different deck configurations
- WHEN their storage keys are computed
- THEN the keys differ, so one deck's state cannot overwrite the other's

### Requirement: Settings restoration
The system SHALL restore the active configuration on startup and SHALL treat an absent, unparseable, or incomplete stored configuration as no configuration rather than an error.

#### Scenario: Configuration restored
- GIVEN a stored configuration
- WHEN the app starts
- THEN that configuration is active

#### Scenario: No stored configuration
- GIVEN no stored configuration
- WHEN the app starts
- THEN the app runs with no configuration and directs the user to setup

#### Scenario: Corrupt stored configuration
- GIVEN stored configuration data that cannot be parsed
- WHEN the app starts
- THEN the app runs with no configuration rather than failing

#### Scenario: Incomplete stored configuration
- GIVEN stored data with no sheet URL, or with no front columns or no back columns
- WHEN the app starts
- THEN the app runs with no configuration

### Requirement: Legacy configuration migration
The system SHALL read configuration written by earlier single-column formats, converting the single front and back column into one-element lists, so upgrades do not lose a learner's setup.

#### Scenario: Legacy single-column configuration found
- GIVEN stored configuration holding one front column and one back column as scalars
- WHEN the app starts
- THEN the configuration is restored with one-element front and back lists

#### Scenario: Legacy data missing optional columns
- GIVEN migrated configuration with no tags or ID column
- WHEN it is restored
- THEN both optional columns are restored as unset rather than as errors

### Requirement: Deck state restoration
The system SHALL restore each card's scheduling state, including its due time as a usable date rather than a raw string, and SHALL tolerate decks with missing fields.

#### Scenario: Deck restored
- GIVEN a stored deck with reviewed cards
- WHEN the app starts
- THEN each card's scheduling state is restored with a usable due time
- AND the cards still compare as due or not due correctly

#### Scenario: Review history restored
- GIVEN a stored deck containing review log entries
- WHEN the deck is restored
- THEN those entries are available so the reviewed-today count survives a reload

#### Scenario: Stored deck missing log entries
- GIVEN stored deck data with no review log
- WHEN the deck is restored
- THEN the deck loads with an empty history rather than failing

#### Scenario: Corrupt stored deck
- GIVEN stored deck data that cannot be parsed
- WHEN the deck is loaded
- THEN no deck is returned and the learner starts fresh for that configuration

### Requirement: Automatic deck persistence
The system SHALL save a deck whenever its card states or review history change, keyed to that configuration, so progress survives a reload without an explicit save action.

#### Scenario: Save after rating
- GIVEN a rating applied to a card
- WHEN the resulting deck state settles
- THEN the deck is written to storage under that configuration's key

#### Scenario: Save after deck rebuild
- GIVEN the deck was rebuilt from a reloaded sheet
- WHEN the rebuild settles
- THEN the rebuilt deck is written to storage

#### Scenario: Due time survives serialization
- GIVEN a deck saved with card due times
- WHEN it is read back
- THEN each due time is restored as a date that formats and compares correctly

### Requirement: Progress reset
The system SHALL offer a per-deck reset that discards only the current deck's scheduling state and review history, leaving other decks, the active configuration, and presets untouched, and SHALL rebuild the deck from the sheet so every card returns to the new state.

#### Scenario: Reset current deck
- GIVEN a reviewed deck
- WHEN the learner resets its progress
- THEN that deck's cards and history are erased
- AND the deck is rebuilt with all cards in the new state

#### Scenario: Other decks unaffected
- GIVEN progress stored for several sheets
- WHEN one deck is reset
- THEN the other decks' progress remains

#### Scenario: Configuration and presets preserved
- GIVEN an active configuration and saved presets
- WHEN the current deck's progress is reset
- THEN the configuration and presets remain intact

### Requirement: Clear all memory
The system SHALL offer a destructive action that erases every key in the reserved namespace, across all sheets and presets, and SHALL require explicit confirmation before doing so.

#### Scenario: Confirmation required
- GIVEN the learner chooses to clear memory
- WHEN the confirmation is requested
- THEN the consequence is stated as permanent and irreversible
- AND nothing is erased until the learner confirms

#### Scenario: Cancellation
- GIVEN the confirmation is displayed
- WHEN the learner cancels
- THEN nothing is erased and the session continues

#### Scenario: Confirmed erasure
- GIVEN the learner confirms the erasure
- WHEN it completes
- THEN every reserved-namespace key is removed, including all decks, presets, the active preset, and the configuration
- AND the app returns to configuration setup

#### Scenario: Unrelated keys untouched
- GIVEN other applications' data on the same origin
- WHEN memory is cleared
- THEN only reserved-namespace keys are removed