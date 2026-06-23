# Brain Games by Pi Lens

A Matiks-style **brain-games hub** for exam-prep students — no login, daily
challenges, XP / levels / streaks, and per-game leaderboards. Original
implementation; only the proven UX patterns are borrowed.

**Live:** https://gautamproduct.github.io/brain-games-pi-lens/

## What's inside

- **8 free games**, focus + math mix:
  Schulte Grid · Stroop Rush · Flash Memory · Odd One Out · Speed Math ·
  True or False · Next in Line · Reflex Tap
- **Daily Challenge** — a featured game that rotates by date; every game's puzzle
  is seeded from the date, so it refreshes automatically each day.
- **No login.** Name is asked once (stored locally) and shown on the leaderboard.
- **Gamification:** XP and levels, a daily 🔥 streak (loss-aversion lever),
  per-game best scores.
- **Leaderboards:** per-game (today / all-time) + an overall board, with your
  own row highlighted.
- Bottom-nav hub: Play · Ranks · You.

## Structure

```
src/
  lib/         rng (seeded daily), store (profile + leaderboards), useCountdown
  games/       one component per game + index.js registry (name, colour, blurb)
  App.jsx      hub, name gate, play session, results, ranks, profile
  styles.css
```

Each game implements a tiny contract: `({ rng, onFinish }) => …` and calls
`onFinish({ score, summary })` (higher score = better). Adding a game = drop a
component in `src/games/` and register it in `index.js`.

## Run / build

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
```

## Deploy

Auto-deploys to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`).

## Leaderboard backend

Scores are **localStorage** (per-device) for now. For a real shared / batch
leaderboard, replace the functions in `src/lib/store.js` (`recordScore`,
`getBoard`, `getOverallBoard`) with Supabase/REST calls.
