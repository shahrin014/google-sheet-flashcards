# Proposal: Maintain the word dictionary

## Intent

The app already studies any Google Sheet the user pastes in, but the words themselves have no
home — they are scattered across sheets, edited by hand, and easy to break (blank backs,
duplicate entries, drifting tag spellings). We want one authoritative **Dictionary**: a
worksheet inside the same Google Sheet, holding the list of every word, in the same
header-plus-rows structure the app already consumes.

Maintaining it by hand in the browser does not scale and is where the errors come from. This
change adds a small Python tool in a new `dictionary/` folder that an AI agent can operate
through prompts — reading, validating, normalizing, adding, editing, and removing words — so the
list stays clean without anyone touching spreadsheet cells.

The dictionary is deliberately a sheet rather than a new data store, and the tooling is
deliberately Python rather than app code: no change to the TypeScript/React app is required, and
the Dictionary worksheet is already studyable today by sharing that tab's own link (the app
already preserves `gid` when normalizing a sheet URL).

## Scope

**In scope**

- A new `dictionary/` Python package (`pyproject.toml`, `venv`, pandas) living beside the app.
- Connection to Google Sheets through a service account.
- Non-interactive, machine-readable operations for an AI agent to run via prompts: read, add,
  edit, remove, normalize, validate, and report changes.
- The data contract of the Dictionary worksheet: same structure as the study CSV.
- Guardrails that keep the sheet valid and keep study progress attached to words.

**Out of scope**

- Any change to the TypeScript/React app, its routes, or its storage.
- A new app capability for loading dictionary-backed decks.
- Multi-user editing, concurrency control, or offline queuing.
- Enrichment of words (definitions, translations, audio) beyond what the columns already hold.

**Constraints**

- Python 3.12+, `pandas`, virtual environment, `pyproject.toml`.
- Service-account credentials stay out of version control.
- Scripts must never block on interactive prompts, or an agent run will hang.

## Capabilities

**New Capabilities**

- `word-dictionary` — the Dictionary worksheet and the operations that maintain it.

**Modified Capabilities**

- None. Existing capabilities are untouched; `word-dictionary` is additive and the app consumes
  the sheet through the existing `sheet-ingestion` path.

## Approach

A standalone `dictionary/` package exposing one console entry point with non-interactive
subcommands, each printing JSON on stdout and exiting non-zero on failure. `pandas` holds the
sheet as a DataFrame for validation and normalization; `gspread` (on `google-auth`) is the
transport. Every write is validated first and reports a before/after summary, so an agent prompt
is a single command plus a single result to reason about.

The design and implementation checklist live in `design.md` and `tasks.md` in this folder.