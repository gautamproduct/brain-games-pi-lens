# Speed Math — Daily Challenge

A one-a-day mental-math game with a leaderboard. Built for exam-prep students:
trains fast calculation and focus, with a competitive daily habit loop.

## How it works

- **7 problems**, same set for everyone on a given day (deterministically seeded
  from the date — see `src/daily.js`).
- Difficulty ramps: add/subtract → tables → %/division/2-digit× → squares & order-of-ops.
- **One attempt per day.** After playing, the device is locked until tomorrow.
- **Scoring:** 100 base points per correct answer + up to 50 speed bonus
  (answer within 6s for the full bonus; 15s timeout per question). Max **1050**.
- **Leaderboard:** daily board (ranked by score, ties broken by total time) and
  an all-time Hall of Fame.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## Deploy to Vercel

Vercel auto-detects Vite. Either:

- Push to GitHub and import the repo at vercel.com (framework preset: **Vite**,
  build `npm run build`, output `dist`), or
- `npx vercel` from this folder.

No environment variables needed.

## Leaderboard: localStorage vs. a real shared board

The leaderboard currently uses **localStorage** — scores are per-device, so it works
instantly with zero backend. Good for a demo or single-class kiosk.

For a **real cross-device leaderboard**, swap the four functions in
`src/leaderboard.js` (`submitScore`, `getDailyBoard`, `getAllTimeBoard`,
`getTodayResult`) for calls to a backend. The fastest path is Supabase free tier:

1. Create a `scores` table: `name`, `score`, `correct`, `time_ms`, `date`, `created_at`.
2. Insert on submit, select-and-order for the boards.
3. Keep the "already played today" check server-side (by date + a device/user id)
   to stop replays.

> Note on anti-cheat: total time is logged per run, so suspiciously fast perfect
> scores can be flagged — a gap Matiks' leaderboard doesn't cover.
