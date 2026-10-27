## ADDED Requirements

### Requirement: Persistent rating bar
When a card is revealed, the system SHALL present the four ratings in a bar fixed to the bottom of the viewport, visible without scrolling, and SHALL keep the card content clear of the bar.

#### Scenario: Ratings visible without scrolling
- GIVEN a revealed card on a short viewport
- WHEN the rating bar is rendered
- THEN all four ratings are visible at the bottom of the viewport
- AND no scrolling is required to reach them

#### Scenario: Unrevealed card
- GIVEN an unrevealed card
- WHEN the study screen is rendered
- THEN no rating bar is shown

### Requirement: Single-row rating grid
The four ratings SHALL remain in one row at every viewport width, and each label SHALL shrink to fit instead of wrapping or overflowing.

#### Scenario: Narrow viewport
- GIVEN a viewport narrow enough that the default label size would overflow
- WHEN the rating bar is rendered
- THEN the four buttons remain in one row
- AND the labels shrink to fit

#### Scenario: Long interval label
- GIVEN a rating whose interval label is longer than the button's default text width
- WHEN the label is rendered
- THEN it stays on one line within the button

### Requirement: Rating color hierarchy
Each rating SHALL use a distinct accent color with readable contrast in light and dark mode.

#### Scenario: Distinct ratings
- GIVEN the four rating buttons are rendered
- WHEN their colors are compared
- THEN Again, Hard, Good, and Easy each have a distinct accent

#### Scenario: Dark mode
- GIVEN the system prefers dark mode
- WHEN the rating bar is rendered
- THEN every rating label remains readable against its button background
