# Sheet Ingestion Specification

## Purpose
Retrieving a user-supplied Google Sheets URL as CSV and turning it into the column names and row objects the rest of the app selects columns from. Owns URL normalization, fetch error reporting, and per-URL response caching.

## Requirements

### Requirement: Google Sheets URL normalization
The system SHALL rewrite any pasted sheet URL into a URL that returns CSV, so the user never has to construct an export link by hand. Surrounding whitespace SHALL be trimmed before any matching.

#### Scenario: URL already requests CSV
- GIVEN a URL containing `output=csv` or `format=csv`
- WHEN the URL is normalized
- THEN it is returned unchanged apart from trimming

#### Scenario: Published-to-web link
- GIVEN a URL of the form `docs.google.com/spreadsheets/d/e/<key>/pub`
- WHEN the URL is normalized
- THEN it becomes `docs.google.com/spreadsheets/d/e/<key>/pub?output=csv`
- AND any other query parameters on the original link are dropped

#### Scenario: Shared or edit link
- GIVEN a URL of the form `docs.google.com/spreadsheets/d/<id>/...`
- WHEN the URL is normalized
- THEN it becomes `docs.google.com/spreadsheets/d/<id>/export?format=csv`

#### Scenario: Sheet ID selection is preserved
- GIVEN a shared or edit link whose `gid` query or fragment parameter is present
- WHEN the URL is normalized
- THEN the resulting export URL carries the same `gid`
- AND a link with no `gid` produces an export URL with no `gid`

#### Scenario: Unrecognized URL
- GIVEN a URL that matches no Google Sheets pattern and requests no CSV format
- WHEN the URL is normalized
- THEN it is returned unchanged apart from trimming, so non-Google CSV endpoints still work

### Requirement: CSV retrieval
The system SHALL request the normalized URL from the browser and return the sheet's column names and row objects.

#### Scenario: Successful retrieval
- GIVEN a sheet URL that resolves to CSV
- WHEN the sheet is fetched
- THEN the first row is treated as the header
- AND the returned column names are the header cells
- AND each returned row is an object keyed by column name

#### Scenario: Request rejected by the server
- GIVEN a sheet URL that responds with a non-2xx status
- WHEN the sheet is fetched
- THEN the fetch fails with an error naming the status code
- AND the error tells the user to make sure the sheet is shared or published to the web

#### Scenario: Private sheet returns a login page
- GIVEN a sheet URL whose response body begins with `<`
- WHEN the sheet is fetched
- THEN the fetch fails with an error stating that an HTML page was received instead of CSV
- AND the error states that the sheet may be private

### Requirement: Blank row exclusion
The system SHALL omit rows whose every value is empty or whitespace, so separator and trailing rows never become cards.

#### Scenario: Whitespace-only row
- GIVEN a sheet containing a row where all cells are empty or whitespace
- WHEN the sheet is fetched
- THEN that row is absent from the returned rows
- AND the reported row count reflects the exclusion

### Requirement: Sheet title retrieval
The system SHALL attempt to read the sheet's human-readable title for use in preset naming. This lookup is best-effort and MUST NOT block or fail previewing.

#### Scenario: Title found
- GIVEN a sheet whose HTML page contains a `<title>` element
- WHEN the title is fetched
- THEN the title text is returned with a trailing ` - Google Sheets` suffix removed

#### Scenario: Title unavailable
- GIVEN a request that fails, or a page with no `<title>` element, or an empty title
- WHEN the title is fetched
- THEN no error is raised
- AND the caller receives no title

### Requirement: Per-URL response caching
The system SHALL cache fetched sheets by normalized URL so repeated reads of the same sheet do not re-issue network requests, while still allowing an explicit refresh.

#### Scenario: Repeated fetch of the same sheet
- GIVEN a sheet URL whose normalized form has already been fetched successfully
- WHEN the sheet is fetched again without forcing a refresh
- THEN the cached result is returned and no new request is issued

#### Scenario: Forced refresh
- GIVEN a sheet URL with a cached result
- WHEN the sheet is fetched with the refresh flag set
- THEN the network request is re-issued and the new result replaces the cached one

#### Scenario: Failed fetch is not cached
- GIVEN a fetch that failed
- WHEN the same URL is fetched again
- THEN a new network request is attempted rather than the cached failure being replayed