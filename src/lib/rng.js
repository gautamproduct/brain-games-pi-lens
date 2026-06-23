// Seeded RNG so each game's "daily challenge" is the same for everyone that day
// and refreshes automatically when the date rolls over.

export function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashStr(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// A seeded rng for a given game on today's date (or any seed string).
export function makeRng(seedStr) {
  return mulberry32(hashStr(seedStr))
}

export function dailyRng(gameId) {
  return makeRng(`${gameId}:${todayKey()}`)
}

// helpers built on an rng function
export const ri = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1))
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)]

export function shuffle(rng, arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
