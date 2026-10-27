## ADDED Requirements

### Requirement: Fixed rating bar
When a card is revealed, the system SHALL present the four ratings in a bar fixed to the bottom of the viewport without covering the card.

#### Scenario: Revealed card
- GIVEN a revealed card on a short viewport
- WHEN the rating bar is rendered
- THEN all four ratings are visible without scrolling

#### Scenario: Unrevealed card
- GIVEN an unrevealed card
- WHEN the study screen is rendered
- THEN no rating bar is shown

### Requirement: Rating bar readability
The four ratings SHALL stay in one row, labels SHALL shrink to fit instead of wrapping or overflowing, and each rating SHALL use a distinct, readable color in light and dark mode.

#### Scenario: Narrow viewport
- GIVEN a viewport narrow enough that the default label size would overflow
- WHEN the rating bar is rendered
- THEN the four buttons remain in one row
- AND their labels shrink to fit

#### Scenario: Long interval label
- GIVEN a rating whose interval label is longer than the button's default width
- WHEN the label is rendered
- THEN it stays on one line within the button

#### Scenario: Distinct colors
- GIVEN the four rating buttons are rendered
- WHEN their colors are compared
- THEN each rating has a distinct accent

#### Scenario: Dark mode
- GIVEN the system prefers dark mode
- WHEN the rating bar is rendered
- THEN every rating remains readable against its background
