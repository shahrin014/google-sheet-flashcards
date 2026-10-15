## MODIFIED Requirements

### Requirement: Rating interval labelling
Rating buttons SHALL display the interval each rating would produce for the current card — the exact interval that pressing the button applies — and SHALL carry the rating's name.

#### Scenario: Intervals shown per rating
- GIVEN a revealed current card
- WHEN the rating buttons are rendered
- THEN each button shows the interval for its own rating outcome

#### Scenario: Rating name available
- GIVEN the rating buttons are rendered
- WHEN a button is inspected
- THEN it names the rating it applies
