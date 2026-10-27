# Tasks

Verification commands assume the repo root unless stated otherwise. The web app is not
touched by this change; group 7 proves that.

## 1. Scaffold the Python package

- [ ] 1.1 Create `dictionary/pyproject.toml`: PEP 621 metadata, `requires-python = ">=3.12"`,
      runtime deps `pandas`, `gspread`, `google-auth`, optional extra `dev` with `pytest`,
      build backend `hatchling` with `packages = ["src/word_dictionary"]`,
      console script `word-dict = "word_dictionary.cli:main"`, and
      `[tool.pytest.ini_options] testpaths = ["tests"]`.
- [ ] 1.2 Create `dictionary/src/word_dictionary/__init__.py` and an empty `cli.py` whose
      `main()` parses subcommands and exits `0`.
- [ ] 1.3 Create `dictionary/.venv` and install the package editable with the dev extra.
- [ ] 1.4 Create `dictionary/README.md` documenting the command surface, the column-mapping
      flags, the exit-code table, and the credential setup steps.

**Verify:** `cd dictionary && python3 -m venv .venv && .venv/bin/pip install -e ".[dev]" && .venv/bin/python -c "import pandas, gspread, google.auth; print('deps ok')" && .venv/bin/word-dict --help`

## 2. Credentials and sheet transport

- [ ] 2.1 `sheet.py` — resolve credentials in the order `--credentials` flag, then
      `GOOGLE_APPLICATION_CREDENTIALS`, then `dictionary/service-account.json`.
- [ ] 2.2 `sheet.py` — when nothing resolves, exit `2` naming the expected file and stating
      that the sheet must be shared with the service account email, and send the message to
      stderr rather than stdout.
- [ ] 2.3 `sheet.py` — open a worksheet by name and read it as records plus header; exit `2`
      with an actionable message when the sheet or worksheet cannot be reached.
- [ ] 2.4 `sheet.py` — write records back in one batch, never appending piecemeal.
- [ ] 2.5 Ensure no function in `sheet.py` can emit key material into a result or error.

**Verify:** `cd dictionary && .venv/bin/python -m pytest tests/test_sheet.py -q`

## 3. Read and report

- [ ] 3.1 `ops.py` — `read` returns the header, all rows, and a word count; succeeds with zero
      words when only a header row exists.
- [ ] 3.2 `ops.py` — `report` returns summary counts for the given mapping: total words,
      duplicate headwords, rows missing a side, rows with no ID.
- [ ] 3.3 Tests for both, including the empty-dictionary case.

**Verify:** `cd dictionary && .venv/bin/python -m pytest tests/test_ops.py -q`

## 4. Validation

- [ ] 4.1 `validate.py` — accept a column mapping (`front`, `back`, optional `key`, `tags`,
      `id`) and return violations and warnings separately.
- [ ] 4.2 Violation: header missing any mapped column.
- [ ] 4.3 Violation: duplicate headwords, compared after trimming and case-folding.
- [ ] 4.4 Violation: a row with no value in any mapped front column, or no value in any mapped
      back column — mirroring the row the app would skip while studying.
- [ ] 4.5 Violation: two rows sharing a non-empty ID.
- [ ] 4.6 Warnings: empty `tags`, empty `id`.
- [ ] 4.7 A valid dictionary produces zero violations; an empty one is not an error.

**Verify:** `cd dictionary && .venv/bin/python -m pytest tests/test_validate.py -q`

## 5. Normalization and stable IDs

- [ ] 5.1 `normalize.py` — trim surrounding whitespace from every value.
- [ ] 5.2 `normalize.py` — tags: split on commas and whitespace, lowercase, de-duplicate, join
      with `", "`, and never drop a tag in the process.
- [ ] 5.3 `normalize.py` — leave the substance of every non-tag field untouched.
- [ ] 5.4 `ids.py` — assign `w-` plus 10 hex characters from `uuid4()` to rows with no ID.
- [ ] 5.5 `ids.py` — never regenerate an existing ID, including after a headword edit.
- [ ] 5.6 `ids.py` — assert uniqueness of the resulting IDs within a write.

**Verify:** `cd dictionary && .venv/bin/python -m pytest tests/test_normalize.py tests/test_ids.py -q`

## 6. Write operations

- [ ] 6.1 `ops.py` — `add` accepts words from `--file` or `--json`, normalizes, validates, and
      appends only rows that pass; skips an existing headword and reports it as a duplicate.
- [ ] 6.2 `ops.py` — `add` processes a batch per-word, reporting `added` and
      `skipped_duplicates` separately.
- [ ] 6.3 `ops.py` — `edit --id` updates exactly one row and preserves its ID.
- [ ] 6.4 `ops.py` — `remove --id` deletes exactly one row and leaves all others untouched.
- [ ] 6.5 Refusals: a target matching no row, or more than one row without an ID, exit `3`
      and write nothing; a failed validation exits `1` and writes nothing.
- [ ] 6.6 Every write returns the counts block (`added`, `updated`, `removed`, `unchanged`,
      `skipped_duplicates`) plus violations and warnings.

**Verify:** `cd dictionary && .venv/bin/python -m pytest tests/test_ops.py -q`

## 7. CLI contract and app regression

- [ ] 7.1 `cli.py` — wire all six subcommands with shared flags for `--sheet`, `--worksheet`,
      `--credentials`, `--pretty`.
- [ ] 7.2 `cli.py` — print exactly one JSON document to stdout; send prose to stderr.
- [ ] 7.3 `cli.py` — map outcomes to exit codes `0`/`1`/`2`/`3` as designed.
- [ ] 7.4 `cli.py` — never read stdin interactively; every command completes with stdin closed.
- [ ] 7.5 Tests covering each exit code and the single-JSON-document guarantee.

**Verify:** `cd dictionary && .venv/bin/python -m pytest tests/test_cli.py -q`

## 8. Full verification

- [ ] 8.1 Python suite green: `cd dictionary && .venv/bin/python -m pytest`
- [ ] 8.2 Web app unaffected: `npm run test`, `npm run lint`, `npm run build`
- [ ] 8.3 Spec artifacts present and valid: `openspec validate maintain-word-dictionary --strict`
- [ ] 8.4 Credentials still ignored: `git status --ignored dictionary/` shows `.venv/` and any
      service-account key as ignored.
