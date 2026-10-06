# Study Session Specification

## Purpose
The screen where a learner actually studies: presenting one card at a time, revealing its back, capturing the rating by click or keyboard, and reporting session progress. Owns the interaction contract of the study surface, independent of how cards are scheduled or stored.

## Requirements

### Requirement: Card presentation
The system SHALL present one card at a time, showing only its front until the learner reveals it. Each selected column SHALL occupy its own labeled line so multi-column cards stay legible.

#### Scenario: Front side hidden
- GIVEN a card has not been revealed
- WHEN the card is displayed
- THEN only the front columns are shown, each labeled with its column name
- AND no back content is visible

#### Scenario: Revealed back side
- GIVEN a card has been revealed
- WHEN the card is displayed
- THEN only the back columns are shown, each labeled with its column name
- AND the front content is no longer shown

#### Scenario: Blank cells omitted
- GIVEN a selected column whose value is empty or whitespace for the current card
- WHEN the card side is rendered
- THEN no line is emitted for that column

#### Scenario: Multi-column card
- GIVEN a configuration with several front and back columns
- WHEN the card is displayed
- THEN every populated column appears as its own line, in the order the user selected them

### Requirement: Tag display
When a tags column is configured, the system SHALL show the current card's tags as badges above the card, splitting on commas and whitespace and discarding empty fragments.

#### Scenario: Multiple tags
- GIVEN a tags cell reading `math, unit-3 verbs`
- WHEN the card is displayed
- THEN the badges read `math`, `unit-3`, and `verbs`

#### Scenario: No tags column
- GIVEN no tags column is configured
- WHEN a card is displayed
- THEN no tag badges are shown

#### Scenario: Empty tags cell
- GIVEN a tags column is configured but the current row's cell is empty
- WHEN the card is displayed
- THEN no tag badges are shown

### Requirement: Reveal interaction
The system SHALL reveal the back of the card on a click on the card, or on Space or Enter.

#### Scenario: Click to reveal
- GIVEN an unrevealed card
- WHEN the learner clicks the card
- THEN the back is revealed

#### Scenario: Keyboard reveal
- GIVEN an unrevealed card
- WHEN the learner presses Space or Enter
- THEN the back is revealed
- AND the key's default action does not occur

#### Scenario: Revealing an already revealed card
- GIVEN a revealed card
- WHEN the learner clicks the card or presses Space
- THEN the card stays revealed and no rating is submitted

### Requirement: Rating interaction
The system SHALL offer exactly four ratings in the fixed order Again, Hard, Good, Easy, each reachable by button or by the corresponding number key 1 through 4, and SHALL submit the rating the moment it is chosen.

#### Scenario: Rating by button
- GIVEN a revealed card
- WHEN the learner clicks a rating button
- THEN that rating is submitted and the next due card is presented with its back hidden again

#### Scenario: Rating by keyboard
- GIVEN a revealed card
- WHEN the learner presses 1, 2, 3, or 4
- THEN the corresponding rating is submitted, with 1 meaning Again and 4 meaning Easy

#### Scenario: Number keys ignored before reveal
- GIVEN an unrevealed card
- WHEN the learner presses a number key
- THEN no rating is submitted

#### Scenario: Ratings hidden before reveal
- GIVEN an unrevealed card
- WHEN the card is displayed
- THEN no rating buttons are shown

#### Scenario: Key hints match the buttons
- GIVEN the rating buttons are shown
- WHEN they are rendered
- THEN each button displays the number key that triggers it, in the same order as the ratings

#### Scenario: On-screen guidance
- GIVEN an unrevealed card
- WHEN the card is displayed
- THEN the interface tells the learner to click or press Space to reveal
- AND once revealed, it tells the learner to press 1 through 4 or click a button

### Requirement: Held-key suppression
The system SHALL ignore auto-repeating key events so that holding Space or a number key does not submit repeated ratings.

#### Scenario: Key held down
- GIVEN the learner holds Space or a number key
- WHEN repeated key events arrive
- THEN only the initial key press takes effect

### Requirement: Rating interval labelling
Rating buttons SHALL display the interval each rating would produce for the current card, and SHALL carry the rating's name.

#### Scenario: Intervals shown per rating
- GIVEN a revealed current card
- WHEN the rating buttons are rendered
- THEN each button shows the interval for its own rating outcome

#### Scenario: Rating name available
- GIVEN the rating buttons are rendered
- WHEN a button is inspected
- THEN it names the rating it applies

### Requirement: New-card indication
The system SHALL mark a card as new once revealed, so the learner can distinguish first encounters from reviews.

#### Scenario: Revealed new card
- GIVEN the current card is in the new state and is revealed
- WHEN the card is displayed
- THEN it is badged as new

#### Scenario: Revealed reviewed card
- GIVEN the current card has been reviewed before
- WHEN it is displayed
- THEN no new badge is shown

### Requirement: Session progress indicators
The system SHALL display, in the study header, how many cards are new, how many are due now, and how many were reviewed today.

#### Scenario: Header indicators
- GIVEN an open study session
- WHEN the header is displayed
- THEN it reports the new-card count, the due-card count, and the reviewed-today count

#### Scenario: Indicators update as the session proceeds
- GIVEN cards due at the start of a session
- WHEN cards are rated
- THEN the due count falls and the reviewed-today count rises

### Requirement: Session completion
When no cards are due, the system SHALL report that the session is caught up, summarize the counts, and offer the reset control.

#### Scenario: Nothing due
- GIVEN a loaded sheet with no due cards
- WHEN the session is displayed
- THEN a caught-up message is shown with the new and reviewed-today counts
- AND no card is presented

### Requirement: Session waiting and failure states
The system SHALL distinguish a sheet still loading, a sheet that failed to load, and an active session, and SHALL offer a route back to configuration when the sheet cannot be loaded.

#### Scenario: Sheet loading
- GIVEN a study session whose sheet is still being fetched
- WHEN the screen is displayed
- THEN a loading state is shown instead of a card

#### Scenario: Sheet failed to load
- GIVEN a study session whose sheet fetch failed
- WHEN the screen is displayed
- THEN the underlying error message is shown with a control to go to configuration
- AND no card is presented