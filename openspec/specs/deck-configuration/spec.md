# Deck Configuration Specification

## Purpose
The guided two-step setup that turns a pasted sheet URL into a studyable column mapping: which columns form the front of a card, which form the back, and which optional columns supply card IDs and tags. Owns the shape and validity of the deck settings that every other capability consumes.

## Requirements

### Requirement: Deck settings model
A deck configuration SHALL consist of a sheet URL, an ordered list of front columns, an ordered list of back columns, and optional tags and ID columns. A configuration MUST have at least one front column and at least one back column to be usable.

#### Scenario: Multiple columns per side
- GIVEN a user who selects three front columns and two back columns
- WHEN the configuration is built
- THEN the column order chosen by the user is preserved on each side

#### Scenario: Optional columns omitted
- GIVEN a user who leaves the tags column and the ID column unset
- WHEN the configuration is built
- THEN both are recorded as empty
- AND the deck remains usable

#### Scenario: Configuration with no front column
- GIVEN a configuration with an empty front column list
- WHEN it is evaluated for use
- THEN it is rejected as unusable

#### Scenario: Configuration with no back column
- GIVEN a configuration with an empty back column list
- WHEN it is evaluated for use
- THEN it is rejected as unusable

### Requirement: Guided setup flow
The system SHALL present configuration as two ordered steps: a URL step that loads and previews the sheet, then a column-mapping step. The URL step SHALL report how many rows the sheet contains and render a preview table of the fetched rows before the user proceeds.

#### Scenario: Proceeding from preview to mapping
- GIVEN a successfully loaded preview on the URL step
- WHEN the user continues
- THEN the column-mapping step is shown for the same sheet

#### Scenario: Column-mapping step without a preview
- GIVEN the user reaches the column-mapping step with no loaded preview
- WHEN the step renders
- THEN the user is redirected back to the URL step

#### Scenario: Preview state is shared between steps
- GIVEN a preview loaded on the URL step
- WHEN the user moves to the column-mapping step and back again without reloading
- THEN the previously loaded preview is still available

### Requirement: Sensible defaults for a newly loaded sheet
When a sheet preview loads, the system SHALL pre-select defaults so the common single-column-to-single-column sheet requires no column edits: the first column as the only front column, the next two columns as back columns, and a column named `Tag` or `Tags` (case-insensitive) as the tags column. The ID column SHALL default to unset.

#### Scenario: Narrow sheet
- GIVEN a sheet with columns `Word`, `Meaning`, `Extra`
- WHEN the preview loads
- THEN `Word` is selected as the only front column
- AND `Meaning` is selected as the only back column
- AND no tags or ID column is selected

#### Scenario: Tags column detected by name
- GIVEN a sheet containing a column named `Tags`
- WHEN the preview loads
- THEN that column is selected as the tags column

#### Scenario: No tags-like column
- GIVEN a sheet with no column named `Tag` or `Tags`
- WHEN the preview loads
- THEN no tags column is selected

### Requirement: Column mapping controls
The mapping step SHALL offer every column present in the loaded sheet as a selectable option on both the front and back sides, and SHALL offer the same set of columns for the optional ID and tags pickers.

#### Scenario: Selecting additional columns
- GIVEN a loaded preview
- WHEN the user selects another column for the back side
- THEN it is added to the back column list without removing the existing selection

#### Scenario: Clearing an optional column
- GIVEN a tags column is selected
- WHEN the user clears the tags picker
- THEN the tags column becomes unset rather than an empty string

### Requirement: Applying a configuration
When the user starts studying from the mapping step, the system SHALL persist the configuration, mirror it into the address bar, and create and activate a named preset for it before navigating to the study screen.

#### Scenario: Starting study with a valid mapping
- GIVEN at least one front column and one back column are selected
- WHEN the user starts studying
- THEN the configuration is persisted as the active settings
- AND a preset is saved under the chosen name and marked active
- AND the user lands on the study screen

#### Scenario: Starting study with an incomplete mapping
- GIVEN no front column or no back column is selected
- WHEN the user attempts to start studying
- THEN the start action is unavailable and cannot be triggered

#### Scenario: Starting with Enter from the preset name field
- GIVEN the preset name input has focus and a valid mapping is selected
- WHEN the user presses Enter
- THEN the same start action runs as the button

### Requirement: Setup input validation
The URL step SHALL reject empty input without issuing a request, and SHALL clear a displayed error when the user edits the URL.

#### Scenario: Empty URL submitted
- GIVEN the URL field is empty or whitespace-only
- WHEN the user requests a preview
- THEN no network request is made
- AND an error asks the user to paste a Google Sheets URL

#### Scenario: Failed preview load
- GIVEN a sheet URL whose fetch failed
- WHEN the preview is requested
- THEN the underlying error message is shown
- AND no preview is available

#### Scenario: URL edited after an error
- GIVEN an error is displayed
- WHEN the user edits the URL
- THEN the error is cleared

#### Scenario: Loading state
- GIVEN a preview request in flight
- WHEN the request is outstanding
- THEN the load action is disabled and reports that it is loading