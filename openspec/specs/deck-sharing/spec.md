# Deck Sharing Specification

## Purpose
Encoding a deck configuration in the URL so any deck can be opened directly, bookmarked, or handed to someone else without either side configuring anything, and so the address bar always reflects the deck currently being studied.

## Requirements

### Requirement: URL parameter schema
The system SHALL express a deck configuration with these query parameters: a `sheet` parameter for the sheet URL, repeatable `front` and `back` parameters carrying one column name each, and optional `tags` and `id` parameters for the optional column names.

#### Scenario: Multiple columns encoded
- GIVEN a configuration with two front columns and three back columns
- WHEN it is written to the URL
- THEN the `front` parameter appears twice and the `back` parameter appears three times, preserving order

#### Scenario: Optional columns omitted
- GIVEN a configuration with no tags or ID column
- WHEN it is written to the URL
- THEN neither the `tags` nor the `id` parameter appears

#### Scenario: Sheet URL encoded
- GIVEN a sheet URL containing reserved characters
- WHEN it is written to the URL
- THEN it is percent-encoded so the resulting URL remains valid

#### Scenario: Round trip
- GIVEN any valid configuration
- WHEN it is written to the URL and then read back
- THEN the sheet URL, front columns, back columns, tags column, and ID column all match the original

### Requirement: URL parameters supersede stored settings
On startup, a complete configuration present in the URL SHALL take precedence over any stored configuration, so a shared link opens the deck it describes.

#### Scenario: Shared link with stored settings present
- GIVEN the URL describes a complete configuration
- AND a different configuration is stored
- WHEN the app starts
- THEN the URL's configuration is the active one

#### Scenario: Stored settings used when the URL is incomplete
- GIVEN the URL lacks a front or back column
- WHEN the app starts
- THEN the URL is not treated as a configuration
- AND the stored configuration remains active

#### Scenario: Stored settings used when the URL is empty
- GIVEN a URL with no configuration parameters
- WHEN the app starts
- THEN the stored configuration remains active

#### Scenario: No configuration anywhere
- GIVEN no URL configuration and no stored configuration
- WHEN the app starts
- THEN the app runs with no configuration and sends the learner to setup

### Requirement: Partial link seeds the setup flow
A URL carrying only a sheet URL SHALL prefill the setup flow with that sheet while still leaving the learner unconfigured, so a link can hand over a sheet without dictating a mapping.

#### Scenario: Sheet-only link
- GIVEN a URL with only a `sheet` parameter and no stored configuration
- WHEN the app starts
- THEN the learner is sent to setup with that sheet URL prefilled
- AND no column mapping is applied

#### Scenario: Stored configuration supplies the default URL
- GIVEN no `sheet` parameter in the URL
- AND a stored configuration exists
- WHEN the app starts
- THEN setup, if reached, is prefilled from the stored configuration's sheet URL

### Requirement: Address bar synchronization
Whenever the active configuration changes, the system SHALL replace the query string with the new configuration's parameters, preserving the current path and any fragment, and SHALL NOT add a history entry.

#### Scenario: Configuration applied
- GIVEN the learner changes their configuration
- WHEN the change is applied
- THEN the address bar shows the new parameters
- AND the path and fragment are unchanged

#### Scenario: No history entry added
- GIVEN the learner applies a configuration
- WHEN they press the browser's back button
- THEN they do not traverse a synthetic history entry for that change

#### Scenario: Fragment survives a configuration change
- GIVEN the current URL carries a fragment
- WHEN the configuration is applied
- THEN the fragment is still present in the address bar

### Requirement: Share link generation
The system SHALL build an absolute share link for the current configuration that lands directly on the study screen, copy it to the clipboard, and confirm the outcome to the learner.

#### Scenario: Link opens the deck in the study screen
- GIVEN an open study session
- WHEN a share link is generated
- THEN the link carries the current configuration's parameters
- AND it targets the study screen directly
- AND it is an absolute URL usable outside the current browser

#### Scenario: Copy succeeds
- GIVEN the share link was generated
- WHEN it is copied to the clipboard
- THEN the learner is shown a confirmation that the link was copied

#### Scenario: Copy fails
- GIVEN the clipboard is unavailable or rejects the write
- WHEN the copy is attempted
- THEN a fallback copy path is tried
- AND if that also fails, the learner is told the link could not be copied

#### Scenario: Confirmation clears itself
- GIVEN a copy confirmation is shown
- WHEN a few seconds pass
- THEN the confirmation disappears on its own

#### Scenario: Repeated copies replace the confirmation
- GIVEN a copy confirmation is showing
- WHEN the learner copies the link again
- THEN the newest confirmation replaces the previous one rather than stacking

#### Scenario: Share action available from the session menu
- GIVEN an open study session
- WHEN the learner opens the session menu
- THEN an action to copy the share link is present