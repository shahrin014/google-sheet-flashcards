# Design: Maintain the word dictionary

## Technical approach

A standalone Python package in `dictionary/` that talks to one worksheet of the existing
Google Sheet over the Sheets API. The sheet stays the single source of truth; nothing is
mirrored into the app or into a local database.

Every operation follows the same four-stage pipeline:

```
read → normalize (in memory) → validate → write
```

Validation runs against the *whole* dictionary before any write, and a write is refused
wholesale if it would leave the sheet invalid — partial writes are never attempted.

The consumer of this tool is an AI agent, not a human at a keyboard. That drives three
constraints: commands must never prompt, results must be machine-parseable, and failures must
be distinguishable by exit code.

## Directory layout

```
dictionary/
├── pyproject.toml              PEP 621 metadata, deps, console script, pytest config
├── README.md                   command reference a prompt can point an agent at
├── src/word_dictionary/
│   ├── __init__.py
│   ├── cli.py                  argument parsing, JSON emission, exit codes
│   ├── sheet.py                credential resolution, gspread transport, read/write
│   ├── validate.py             structural rules, given a column mapping
│   ├── normalize.py            whitespace and tag normalization
│   ├── ids.py                  stable ID generation, uniqueness, preservation
│   └── ops.py                  read / add / edit / remove / validate / report
└── tests/
    ├── conftest.py             fake sheet client — no test touches the network
    ├── test_cli.py
    ├── test_sheet.py
    ├── test_validate.py
    ├── test_normalize.py
    ├── test_ids.py
    └── test_ops.py
```

`.venv/` and all Python build artifacts are gitignored at the repo root.

## Architecture decisions

### Decision: the agent supplies the column mapping

The tool never hard-codes or heuristically guesses column names. `word-dict read --json`
returns the raw header; the agent decides which columns are front, back, tags, and id, and
passes that mapping to `validate`, `add`, `edit`, and `remove`.

Rationale: column naming is a property of the user's sheet, not of this tool. Guessing at
`Word` vs `Term` vs `Front` produces silent mis-mappings, which is worse than asking. Keeping
the tool structural also means the spec can state behavior without naming a column, so a
sheet with any schema works.

Consequence: `validate` can only check rules that are expressible given a mapping — header
completeness, duplicate headwords, per-row side emptiness, ID uniqueness. It cannot assert
that a column *means* the right thing; that judgement stays with the agent.

### Decision: pandas as the in-memory model

The sheet is loaded into a `DataFrame` for normalization and validation, then written back as
records. All bulk checks (duplicate detection, per-row side emptiness, ID uniqueness) are
vectorized column operations rather than Python loops.

### Decision: gspread over the raw Google API client

`gspread` (on `google-auth`) gives a records-in/records-out surface that maps directly onto
`pandas.DataFrame`, which is all this tool needs. The raw `google-api-python-client` would
import the whole Sheets surface area for four calls.

### Decision: JSON on stdout, exit codes for the outcome

stdout carries exactly one JSON document per invocation; human-oriented prose goes to stderr.
An agent prompt is therefore "run the command, parse stdout, branch on exit code" — no
output scraping.

| Code | Meaning |
|------|---------|
| `0` | Success. Includes a `validate` run that found no violations. |
| `1` | Validation refused the operation. Nothing was written. |
| `2` | Credential, network, or missing-worksheet failure. Nothing was written. |
| `3` | Target not found, or matched more than one row. Nothing was written. |

The result document has a stable shape:

```json
{
  "ok": true,
  "operation": "add",
  "worksheet": "Dictionary",
  "counts": {
    "added": 2, "updated": 0, "removed": 0,
    "unchanged": 1, "skipped_duplicates": 1
  },
  "violations": [],
  "warnings": [{ "row": 4, "column": "Tags", "reason": "empty" }]
}
```

Failures carry `ok: false` and put the explanation in `error`, never in a bare message on
stdout.

### Decision: credentials resolve in a fixed order, and are never printed

1. `--credentials <path>`
2. `GOOGLE_APPLICATION_CREDENTIALS`
3. `dictionary/service-account.json` (default)

If none resolve, the tool exits `2` naming the file it expected and stating that the sheet
must be shared with the service account's email. Key material is never included in any result,
log, or error. The default path is gitignored so an accidental `--credentials` omission cannot
commit it.

### Decision: stable IDs come from a random UUID, not from content

A new row gets `w-` plus 10 hex characters from `uuid4()`. Once assigned it is **never**
regenerated — not on edit, not on normalization, not if the headword changes.

Content-derived IDs were rejected because the whole point of maintenance is that content
changes; an ID derived from the headword would change with it and silently reset the study
progress the app has recorded against that word. Uniqueness is still asserted at write time,
so a collision is a validation violation rather than a merged card.

### Decision: tags are normalized, headwords are only trimmed

Tags are trimmed, split on commas and whitespace, lowercased, de-duplicated, and rejoined with
`", "`. Casing is not substantive for an organizational label, and one consistent form is what
lets duplicate tags collapse.

Everything else — headword, meaning, any other column — is touched only by surrounding
whitespace removal. The substance of a value is never rewritten.

### Decision: offline tests

`tests/conftest.py` provides a fake sheet client backed by plain records, with the same
read/write surface the production code uses. No test performs network I/O, so the suite runs
in CI without credentials and without touching the real dictionary.

## Command surface

```
word-dict read     [--sheet URL] [--worksheet NAME]
word-dict validate [--sheet URL] [--worksheet NAME] --front COL [--back COL]... [--key COL] [--tags COL] [--id COL]
word-dict add      <same mapping flags> [--file words.json | --json '[...]']
word-dict edit     <same mapping flags> --id ID --field COL --value TEXT
word-dict remove   <same mapping flags> --id ID
word-dict report   [--sheet URL] [--worksheet NAME] --front COL --back COL [--key COL] [--id COL]
```

Global flags: `--credentials PATH`, `--sheet URL|ID`, `--worksheet NAME`, `--pretty`.

Input for `add` is supplied as a file or an inline JSON argument. Stdin is never read
interactively, and no command waits for confirmation.

## Validation rules

**Violations** (exit `1`, nothing written):

- The header is missing a mapped column.
- Two rows share a headword, compared after trimming and case-folding.
- A row has no value in *any* mapped front column, or no value in *any* mapped back column —
  the same condition under which the app silently skips a row while studying.
- Two rows share a non-empty ID.

**Warnings** (write proceeds):

- An optional mapped column (tags, id) is empty on a row.
- A row carries no tags.

Warnings are reported so the agent can decide whether to follow up, without blocking work
that is already structurally sound.

## Data flow

```
                    ┌──────────────────────────────┐
  agent prompt ───► │ word-dict <op> (flags, --json)│
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │ sheet.py                     │
                    │ resolve credentials → open   │
                    │ worksheet → read records     │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │ normalize.py                 │
                    │ trim values, normalize tags, │
                    │ assign IDs to new rows       │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │ validate.py                  │
                    │ rules vs caller's mapping    │
                    └──────┬───────────────┬───────┘
                     ok    ▼               ▼  violations
                    ┌────────────┐   ┌────────────────────┐
                    │ write back │   │ exit 1, JSON report│
                    │ + counts   │   │ nothing written    │
                    └─────┬──────┘   └────────────────────┘
                          ▼
                   exit 0, JSON report
```

## Testing strategy

| File | Covers |
|------|--------|
| `test_sheet.py` | credential resolution order, missing-credential message, key never printed |
| `test_validate.py` | missing column, duplicate headword, empty side, duplicate ID, empty dictionary passes |
| `test_normalize.py` | whitespace trimming, tag lowercasing/dedup/rejoin, no tag dropped, unrelated fields untouched |
| `test_ids.py` | generation, uniqueness, preserved across edit, never regenerated on field change |
| `test_ops.py` | happy paths, duplicate skipping, batch counts, ambiguous and missing target refusals, nothing written on refusal |
| `test_cli.py` | exit codes `0`/`1`/`2`/`3`, stdout parses as a single JSON document, command runs with stdin closed |

## File changes

- **New** `dictionary/pyproject.toml`, `dictionary/README.md`
- **New** `dictionary/src/word_dictionary/{__init__,cli,sheet,validate,normalize,ids,ops}.py`
- **New** `dictionary/tests/{conftest,test_cli,test_sheet,test_validate,test_normalize,test_ids,test_ops}.py`
- **Modified** `.gitignore` — Python artifacts and service-account keys *(already applied)*
- **Modified** `openspec/config.yaml` — Python tooling in `context`, toolchain-aware rules *(already applied)*
- **Unchanged** — the TypeScript/React app, and `openspec/specs/` until this change is archived
