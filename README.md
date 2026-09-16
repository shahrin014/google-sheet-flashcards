# Sheet Flashcards

A free, client-side flashcard app on GitHub Pages. Paste the URL of any Google Sheet, map its columns to flashcard fronts and backs, and study them with Anki-style cards scheduled by [FSRS](https://github.com/open-spaced-repetition/fsrs-ts) (the Free Spaced Repetition Scheduler). Everything runs in the browser — no server, no API keys, your progress is stored in `localStorage`.

▶ [**Open the live app**](https://shahrin014.github.io/google-sheet-flashcards/) — or run your own copy (see below).

## How to use

1. Open your Google Sheet with flashcard content.
2. Optional but recommended: share it as “Anyone with the link → Viewer”.
3. Paste the sheet's URL into Sheet Flashcards and load the preview.
4. Pick the **front columns** and **back columns** — each selected column becomes its own line on the card.
5. Study: click or press `Space` to flip a card, then rate with `Again / Hard / Good / Easy` (keys `1–4`).

### Configure via URL

Everything is passed as URL parameters, so a deck can be opened directly by sharing a link:

| Param  | Meaning                                   | Example                         |
| ------ | ----------------------------------------- | ------------------------------- |
| `sheet`| Google Sheets URL (encoded)              | `sheet=https%3A%2F%2Fdocs%2E…`  |
| `front`| a front column — repeat to add more       | `front=Mandarin`                |
| `back` | a back column — repeat to add more        | `back=English&back=Japanese`    |
| `tags` | optional tags column                     | `tags=Tags`                     |
| `id`   | optional stable-ID column                | `id=ID`                         |

Example:

```
https://shahrin014.github.io/google-sheet-flashcards/?sheet=<encoded-url>&front=Mandarin&back=Mandarin%20(Pinyin)&back=English&back=Japanese
```

### Sheet format

| Front | Back | Tags |
| ----- | ---- | ---- |
| What is 2+2? | 4 | math |

The first row should be a header. Any CSV-able Google Sheet works — the URL is normalized automatically whether you paste the shared link (`/spreadsheets/d/…`) or a published-web CSV link (`/spreadsheets/d/e/…/pub`).

## Local development

```bash
npm install
npm run dev      # dev server
npm run build    # type-check + production build → dist/
npm run preview  # serve the production build
npm run lint     # oxlint
```

## Deploy to GitHub Pages

This repo already includes a workflow that builds the app and deploys it on every push to `main`. To activate it:

1. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. The next push (or **Actions → Deploy to GitHub Pages → Run workflow**) deploys the site.
3. Your site is live at `https://shahrin014.github.io/google-sheet-flashcards/`.

The Vite `base` is set to `./`, so the app also works under any other Pages path (`<user>.github.io/<repo>`).

## How scheduling works

Each row maps to a card id (the ID column if you set one, otherwise a hash of the selected columns' values). New rows become new cards; existing cards keep their FSRS state so editing the sheet never resets progress. Rows where every front column **or** every back column is empty are skipped. Every review is recorded and the FSRS due date is persisted in `localStorage` under `gsf.deck.*`.