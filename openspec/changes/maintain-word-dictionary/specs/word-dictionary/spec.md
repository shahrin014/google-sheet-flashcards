# Delta for Word Dictionary

## Purpose

The curated list of every word the learner studies, held as a worksheet inside the same Google
Sheet the app already reads, plus the non-interactive operations an AI agent uses to read,
validate, normalize, add, edit, and remove words without corrupting the sheet or resetting study
progress.

## ADDED Requirements

### Requirement: Dictionary location and structure
The dictionary SHALL be a single worksheet inside the Google Sheet already used by the app, and
SHALL use the same structure as the study data: one header row naming the columns, followed by
data rows. It MUST NOT introduce a new storage location or a schema the app cannot read.

#### Scenario: Worksheet lives in the existing sheet
- GIVEN the Google Sheet the app already studies
- WHEN the dictionary is located
- THEN it is a worksheet within that same spreadsheet
- AND no separate spreadsheet, database, or file format is required for the app to read it

#### Scenario: Header row defines the columns
- GIVEN the dictionary worksheet
- WHEN its contents are read
- THEN the first row is interpreted as column names
- AND every subsequent row is a word

#### Scenario: Structure matches the study data
- GIVEN the dictionary worksheet
- WHEN its columns are compared with a study sheet
- THEN it uses the same header-plus-data-row structure, so the app can study it unchanged

#### Scenario: Dictionary worksheet addressed by its own tab
- GIVEN a workbook with several worksheets
- WHEN the dictionary worksheet is opened for maintenance
- THEN only that worksheet is affected and other worksheets in the workbook are left untouched

### Requirement: Agent-operated command surface
The tooling SHALL expose every maintenance operation as a non-interactive command that returns a
machine-readable result, so an AI agent can drive it from a single prompt without a human at a
keyboard.

#### Scenario: Operation run from a prompt
- GIVEN an AI agent asked to add words to the dictionary
- WHEN it runs the corresponding command
- THEN the command completes without prompting for input
- AND its result is emitted as JSON on standard output

#### Scenario: Failure is machine-detectable
- GIVEN a command that cannot complete
- WHEN it exits
- THEN it exits non-zero
- AND the failure is described in machine-readable form rather than only in prose

#### Scenario: No interactive prompts
- GIVEN any maintenance operation
- WHEN it is run by an agent
- THEN it never waits for stdin, a confirmation, or an editor

#### Scenario: Result states what changed
- GIVEN a write operation that completed
- WHEN its result is read
- THEN it reports how many words were added, updated, removed, and left unchanged
- AND it reports any validation warnings alongside those counts

### Requirement: Credential handling
The tooling SHALL authenticate to Google Sheets with a service account whose key file is never
committed to the repository, and SHALL fail with an actionable message when credentials are
missing or the sheet has not been shared with the service account.

#### Scenario: Credentials supplied
- GIVEN a service-account key file is present and the sheet is shared with that service account's
  email
- WHEN an operation runs
- THEN it reads or writes the dictionary worksheet

#### Scenario: Credentials missing
- GIVEN no service-account key file is available
- WHEN an operation runs
- THEN no request is sent
- AND the error tells the user which file is expected and that the sheet must be shared with the
  service account email

#### Scenario: Credentials excluded from version control
- GIVEN the repository's ignore rules
- WHEN the key file is checked
- THEN it is ignored by git
- AND no operation prints key material into its result or logs

### Requirement: Reading the dictionary
The tooling SHALL be able to read the dictionary and report its columns and words, so an agent
can inspect the current state before proposing a change.

#### Scenario: Reading all words
- GIVEN a populated dictionary worksheet
- WHEN the read operation runs
- THEN it returns the column names and every word row
- AND it reports the number of words returned

#### Scenario: Reading an empty dictionary
- GIVEN a dictionary worksheet with a header row and no data rows
- WHEN the read operation runs
- THEN it succeeds with zero words rather than treating the emptiness as an error

#### Scenario: Reading before writing
- GIVEN an agent preparing to add words
- WHEN it runs the read operation first
- THEN it receives enough information to detect a word that already exists

### Requirement: Adding words
The tooling SHALL append new words to the dictionary, and SHALL detect a word that already
exists — comparing headwords with surrounding whitespace and letter case ignored — rather than
creating a duplicate.

#### Scenario: New word appended
- GIVEN a word not present in the dictionary
- WHEN the add operation runs
- THEN the word is appended as a new row
- AND it is counted as added in the result

#### Scenario: Duplicate suppressed
- GIVEN a word whose headword already exists, differing only in case or surrounding whitespace
- WHEN the add operation runs
- THEN no second row is created
- AND the word is reported as a duplicate rather than as added

#### Scenario: Batch of words
- GIVEN several words supplied in one operation
- WHEN the operation runs
- THEN each word is added or skipped on its own
- AND the result counts added and skipped words separately

#### Scenario: Add rejected when validation fails
- GIVEN a word missing a required field
- WHEN the add operation runs
- THEN nothing is written to the sheet
- AND the result identifies the offending word and the reason

### Requirement: Editing and removing words
The tooling SHALL modify or delete an existing word addressed by its stable identifier, and
SHALL refuse an ambiguous match rather than guessing which row to change.

#### Scenario: Edit by stable identifier
- GIVEN a word with a known stable identifier
- WHEN an edit is applied
- THEN that row's fields are updated
- AND the result reports it as updated

#### Scenario: Ambiguous target refused
- GIVEN a target that matches more than one row and carries no stable identifier
- WHEN an edit or removal is requested
- THEN nothing is written
- AND the failure names the rows it could not choose between

#### Scenario: Missing target refused
- GIVEN a target that matches no row
- WHEN an edit or removal is requested
- THEN nothing is written
- AND the failure reports that no such word was found

#### Scenario: Removal
- GIVEN a word addressed unambiguously
- WHEN removal is requested
- THEN that row is deleted and no other row is altered
- AND the result reports it as removed

### Requirement: Normalization
The tooling SHALL normalize words on write — trimming surrounding whitespace, collapsing stray
internal blank space in tags, and unifying tag spelling and case — while preserving every field
the operation was not asked to change.

#### Scenario: Whitespace trimmed
- GIVEN a word whose headword carries surrounding whitespace
- WHEN the word is written
- THEN the stored value has the surrounding whitespace removed

#### Scenario: Tags unified
- GIVEN a word whose tags are written with inconsistent casing or separators
- WHEN the word is written
- THEN the tags are stored in one consistent form
- AND no tag is dropped in the process

#### Scenario: Unrelated fields untouched
- GIVEN an edit that changes only a word's meaning
- WHEN the operation runs
- THEN its headword, tags, and identifier are stored unchanged apart from normalization

#### Scenario: Values that must not be normalized
- GIVEN a field whose content is meaningful as written
- WHEN normalization runs
- THEN only whitespace, tag casing, and tag separators are altered — never the substance of a
  value

### Requirement: Validation before write
The tooling SHALL validate the whole dictionary before any write, and SHALL refuse the write when
the result would be invalid, reporting each violation with the row it affects.

#### Scenario: Required columns present
- GIVEN a dictionary worksheet missing a column the contract requires
- WHEN validation runs
- THEN the write is refused
- AND the missing column is named in the report

#### Scenario: Row with an empty side
- GIVEN a row whose front column and back column are both empty or whitespace
- WHEN validation runs
- THEN the write is refused
- AND the row is reported, because the app would silently skip such a row when studying

#### Scenario: Duplicate headwords
- GIVEN two rows sharing a headword, ignoring case and surrounding whitespace
- WHEN validation runs
- THEN the write is refused
- AND both row positions are reported

#### Scenario: Warnings that do not block a write
- GIVEN a row missing an optional field such as tags
- WHEN validation runs
- THEN the write proceeds
- AND the row is reported as a warning rather than a violation

#### Scenario: Valid dictionary passes
- GIVEN a dictionary with no violations
- WHEN validation runs
- THEN the write proceeds
- AND the result reports zero violations

### Requirement: Identity preservation across maintenance
Maintenance operations SHALL preserve the stable identifier of every existing word across edits
and normalizations, so that maintaining the dictionary never resets the study progress recorded
against those words.

#### Scenario: Editing a word keeps its progress
- GIVEN a word that has been studied, carrying a stable identifier
- WHEN its meaning is edited through the tooling
- THEN its identifier is unchanged
- AND the app still recognises it as the same card on the next load

#### Scenario: New word receives an identifier
- GIVEN a word appended to the dictionary
- WHEN it is written
- THEN it carries a stable identifier, so later edits can address it unambiguously

#### Scenario: Identifiers stay unique
- GIVEN several words added in one operation
- WHEN they are written
- THEN no two rows receive the same identifier

#### Scenario: Identity not silently reassigned
- GIVEN an existing row
- WHEN a normalization or edit runs against it
- THEN its identifier is not regenerated, even if its other fields changed
