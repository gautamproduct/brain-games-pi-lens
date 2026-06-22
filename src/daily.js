// Deterministic daily puzzle generation.
// Everyone who plays on the same date gets the exact same set of problems.

// Mulberry32 — tiny seedable PRNG so the daily set is reproducible.
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

const PUZZLE_COUNT = 7

// Difficulty ramps across the 7 questions.
function makeProblem(rand, index) {
  const tier = index < 2 ? 0 : index < 4 ? 1 : index < 6 ? 2 : 3
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1))

  let text, answer

  if (tier === 0) {
    // Warm-up: 2-digit add / subtract
    const op = pick(['+', '−'])
    let a = between(12, 89)
    let b = between(11, 79)
    if (op === '−' && b > a) [a, b] = [b, a]
    text = `${a} ${op} ${b}`
    answer = op === '+' ? a + b : a - b
  } else if (tier === 1) {
    // Multiplication tables / 2-digit × 1-digit
    const a = between(6, 19)
    const b = between(4, 9)
    text = `${a} × ${b}`
    answer = a * b
  } else if (tier === 2) {
    // Mixed: percentages, division, or 2-digit × 2-digit
    const kind = pick(['pct', 'div', 'mul'])
    if (kind === 'pct') {
      const p = pick([5, 10, 15, 20, 25, 40, 50])
      const base = between(2, 20) * 10
      text = `${p}% of ${base}`
      answer = Math.round((p / 100) * base)
    } else if (kind === 'div') {
      const b = between(3, 12)
      const q = between(4, 15)
      text = `${b * q} ÷ ${b}`
      answer = q
    } else {
      const a = between(12, 29)
      const b = between(11, 19)
      text = `${a} × ${b}`
      answer = a * b
    }
  } else {
    // Challenge: squares, order of operations
    const kind = pick(['sq', 'ooo'])
    if (kind === 'sq') {
      const a = between(12, 25)
      text = `${a}²`
      answer = a * a
    } else {
      const a = between(3, 9)
      const b = between(2, 9)
      const c = between(2, 12)
      text = `${a} × ${b} + ${c}`
      answer = a * b + c
    }
  }

  return { id: index, text, answer }
}

export function getDailyPuzzles(key = todayKey()) {
  const rand = mulberry32(seedFromKey(key))
  const problems = []
  for (let i = 0; i < PUZZLE_COUNT; i++) {
    problems.push(makeProblem(rand, i))
  }
  return problems
}

export const POINTS = {
  base: 100, // per correct answer
  speedMax: 50, // max speed bonus per question
  speedWindow: 6, // seconds; faster than this earns full bonus
  perQuestionTimeout: 15, // seconds before a question auto-fails
}

export const MAX_SCORE = PUZZLE_COUNT * (POINTS.base + POINTS.speedMax)
export { PUZZLE_COUNT }
