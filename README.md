# Sheet Flashcards

A free, client-side flashcard app on GitHub Pages. Paste the URL of any Google Sheet, map its columns to flashcard fronts and backs, and study them with Anki-style cards scheduled by [FSRS](https://github.com/open-spaced-repetition/fsrs-ts) (the Free Spaced Repetition Scheduler). Everything runs in the browser — no server, no API keys, your progress is stored in `localStorage`.

[Live site](https://github.com/your-user/your-repo/settings/pages) — see below to deploy your own copy.

## How to use

1. Open your Google Sheet with flashcard content.
2. Optional but recommended: share it as “Anyone with the link → Viewer”.
3. Copy the sheet's URL and paste it into Sheet Flashcards.
4. Choose the column for the **Front**, the column for the **Back**, and optionally a **Tags** or **ID** column.
5. Study: click or press `Space` to flip a card, then rate with `Again / Hard / Good / Easy` (keys `1–4`).

You can share a deck by appending `?sheet=<encoded-sheet-url>` to the app's URL.

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

1. Push this repository to GitHub.
2. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The included workflow builds the app and deploys it on every push to `main`.
4. Visit `https://<user>.github.io/<repo>/`.

The Vite `base` is set to `./`, so the app works on any Pages path (`user.github.io/repo`).

## How scheduling works

Each row maps to a card id (the ID column if you set one, otherwise a hash of front + back). New rows become new cards; existing cards keep their FSRS state so editing the sheet never resets progress. Every review is recorded and the FSRS due date is persisted in `localStorage` under `gsf.deck.*`.