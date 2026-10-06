# Preset Management Specification

## Purpose
Saved, named sheet-and-column configurations. Lets a learner keep several decks side by side, jump between them, and see at a glance which one they are studying.

## Requirements

### Requirement: Preset content
A preset SHALL consist of a name and a complete deck configuration. Presets MUST be identifiable by name, so that saving the same name twice updates rather than duplicates.

#### Scenario: Preset holds a full configuration
- GIVEN a preset
- WHEN it is inspected
- THEN it carries a name and the sheet URL, front columns, back columns, tags column, and ID column it was saved with

### Requirement: Preset creation and update
The system SHALL save a new preset under a given name, and SHALL overwrite the stored configuration when a preset with the same name already exists.

#### Scenario: First save of a name
- GIVEN no preset named `French`
- WHEN a configuration is saved under that name
- THEN a preset named `French` is created

#### Scenario: Re-saving the same name
- GIVEN an existing preset named `French`
- WHEN a configuration is saved under that name
- THEN the existing preset's configuration is replaced
- AND only one preset with that name exists

#### Scenario: Automatic preset on setup completion
- GIVEN the learner finishes configuring a sheet and starts studying
- WHEN the configuration is applied
- THEN a preset is created for it and marked active

### Requirement: Preset name derivation
When the learner does not supply a preset name, the system SHALL derive one from the sheet's title and the first front and back column, and SHALL let the learner edit it before saving.

#### Scenario: Derived name
- GIVEN a sheet titled `French Vocab` with front column `French` and back column `English`
- WHEN no name is supplied
- THEN the proposed name combines the sheet title with `French → English`

#### Scenario: Blank supplied name
- GIVEN the learner clears the name field
- WHEN the configuration is applied
- THEN the derived name is used instead of a blank one

#### Scenario: Whitespace-only name
- GIVEN the name field contains only whitespace
- WHEN the configuration is applied
- THEN a non-empty name is saved

### Requirement: Active preset tracking
The system SHALL record at most one preset as active, and SHALL clear that marker when it stops being accurate.

#### Scenario: Preset activated
- GIVEN a stored preset
- WHEN the learner activates it
- THEN that preset is recorded as active

#### Scenario: Activation loads the configuration
- GIVEN a stored preset
- WHEN the learner activates it
- THEN the preset's configuration becomes the active configuration
- AND the learner is taken to the study screen

#### Scenario: Marker cleared when unset
- GIVEN an active preset marker
- WHEN no preset is marked active
- THEN the marker is removed

#### Scenario: Marker cleared on deletion
- GIVEN a preset is active
- WHEN that preset is deleted
- THEN no preset remains marked active

### Requirement: Preset listing
The system SHALL list every saved preset with its name, a marker when it is the active one, and a summary of its column mapping, so the learner can tell decks apart at a glance.

#### Scenario: Listing presets
- GIVEN several saved presets
- WHEN the list is displayed
- THEN each preset's name is shown
- AND its front and back columns are summarized
- AND any configured tags or ID column is included in the summary

#### Scenario: No presets saved
- GIVEN no saved presets
- WHEN the list is displayed
- THEN an empty-state message is shown and the learner can create one

#### Scenario: Malformed stored entries
- GIVEN stored preset data containing entries that are not valid presets
- WHEN the list is read
- THEN those entries are discarded and the valid presets are shown

### Requirement: In-session preset switching
From the study screen the system SHALL offer a way to switch presets without leaving the session setup flow, listing each preset with its active marker plus controls to use or delete it, and to save the current configuration as a new preset.

#### Scenario: Switching preset from the session
- GIVEN an open study session
- WHEN the learner opens the preset dialog and chooses a preset
- THEN that preset's configuration becomes active and the session reloads with it

#### Scenario: Current preset not switchable to itself
- GIVEN the active preset
- WHEN the dialog is displayed
- THEN the control for the active preset is unavailable, since it is already in use

#### Scenario: Saving the current configuration as a preset
- GIVEN an open study session
- WHEN the learner names and saves the current configuration
- THEN a preset is created or updated for it and marked active

#### Scenario: Blank name rejected
- GIVEN the dialog's name field is empty or whitespace-only
- WHEN save is attempted
- THEN nothing is saved

### Requirement: Deleting a preset
The system SHALL remove a preset on request, without touching the active configuration or any deck progress.

#### Scenario: Preset deleted
- GIVEN a saved preset
- WHEN the learner deletes it
- THEN it no longer appears in any listing
- AND the deleted preset's own configuration is untouched, so its deck progress survives

#### Scenario: Deletion while studying a different preset
- GIVEN the learner is studying preset A and deletes preset B
- WHEN the deletion completes
- THEN preset A remains active and the session continues