// Daily Schulte Grid generation.
// Everyone who plays on the same date gets the exact same shuffle, so the
// daily leaderboard is a fair race. Practice mode uses a fresh random grid.

export const SIZE = 5
export const CELLS = SIZE * SIZE // 25
export const MISS_PENALTY_MS = 1000 // each wrong tap adds 1s to your time

// Mulberry32 — tiny seedable PRNG so the daily grid is reproducible.
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Local date key like "2026-06-22" so the day rolls over at the player's midnight.
export function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function seedFromKey(key) {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function shuffle(rand) {
  const arr = Array.from({ length: CELLS }, (_, i) => i + 1)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function getDailyGrid(key = todayKey()) {
  return shuffle(mulberry32(seedFromKey(key)))
}

export function getRandomGrid() {
  return shuffle(Math.random)
}
