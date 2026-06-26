import SchulteGrid from './SchulteGrid.jsx'
import StroopRush from './StroopRush.jsx'
import FlashMemory from './FlashMemory.jsx'
import NumberFlash from './NumberFlash.jsx'
import SpeedMath from './SpeedMath.jsx'
import TrueFalse from './TrueFalse.jsx'
import CrossMath from './CrossMath.jsx'
import Zip from './Zip.jsx'

export const GAMES = [
  {
    id: 'schulte',
    name: 'Schulte Grid',
    emoji: '🔢',
    tag: 'Focus',
    blurb: 'Tap 1→25 in order, fast',
    g1: '#7c5cff',
    g2: '#00d4ff',
    how: [
      'Numbers 1–25 are scattered in a 5×5 grid.',
      'Tap them in order: 1, then 2, then 3…',
      'Keep your eyes near the centre — train your side vision.',
      'A wrong tap adds +1s. Finish as fast as you can.',
    ],
    Component: SchulteGrid,
  },
  {
    id: 'stroop',
    name: 'Stroop Rush',
    emoji: '🎨',
    tag: 'Focus',
    blurb: 'Tap the ink colour, not the word',
    g1: '#ff5d6c',
    g2: '#ffb24a',
    how: [
      'A colour word appears — but in a different ink colour.',
      'Tap the colour of the INK, not what the word says.',
      'e.g. “GREEN” written in blue → tap Blue.',
      '10 questions. Score = how many you get right.',
    ],
    Component: StroopRush,
  },
  {
    id: 'flash',
    name: 'Flash Memory',
    emoji: '🧠',
    tag: 'Memory',
    blurb: 'Watch the pattern, repeat it',
    g1: '#2ee6a6',
    g2: '#00d4ff',
    how: [
      'Tiles light up one by one — watch closely.',
      'Then tap them back in the same order.',
      'Each level adds one more tile.',
      'One wrong tile ends the run. How far can you go?',
    ],
    Component: FlashMemory,
  },
  {
    id: 'numflash',
    name: 'Number Flash',
    emoji: '➕',
    tag: 'Mental Math',
    blurb: 'Add the flashing digits',
    g1: '#ffd24a',
    g2: '#2ee6a6',
    how: [
      'Single digits flash on screen one at a time.',
      'Add them up in your head as they go.',
      'At the end, tap the correct total.',
      '5 rounds — each one shows more digits.',
    ],
    Component: NumberFlash,
  },
  {
    id: 'speed',
    name: 'Speed Math',
    emoji: '⚡',
    tag: 'Calc',
    blurb: 'Solve 10 sums fast',
    g1: '#ffd24a',
    g2: '#ff7a4a',
    how: [
      'A sum appears with four answer choices.',
      'Tap the correct answer as fast as you can.',
      'No typing — just tap.',
      '10 questions. Score = how many you get right.',
    ],
    Component: SpeedMath,
  },
  {
    id: 'truefalse',
    name: 'True or False',
    emoji: '⚖️',
    tag: 'Calc',
    blurb: 'Is the equation correct?',
    g1: '#4d8cff',
    g2: '#2ee6a6',
    how: [
      'An equation flashes, e.g. 7 × 8 = 54.',
      'Decide quickly: is it True or False?',
      'Tap ✓ True or ✗ False.',
      '10 questions. Score = how many you get right.',
    ],
    Component: TrueFalse,
  },
  {
    id: 'crossmath',
    name: 'Cross Math',
    emoji: '✖️',
    tag: 'Logic',
    blurb: 'Fill the missing number',
    g1: '#00d4ff',
    g2: '#7c5cff',
    how: [
      'A cross of equations is shown with one number missing.',
      'The blank sits in both a row and a column.',
      'Find the number that makes BOTH work out, and tap it.',
      '5 puzzles. Score = how many you solve.',
    ],
    Component: CrossMath,
  },
  {
    id: 'zip',
    name: 'Zip',
    emoji: '🧩',
    tag: 'Path',
    blurb: 'Complete the path 1→5',
    g1: '#2ee6a6',
    g2: '#00d4ff',
    how: [
      'Draw one path that fills every cell exactly once.',
      'Start at dot 1 and tap neighbouring cells to extend.',
      'Pass through the dots 1 → 5 in order.',
      'Tap the end of your path to undo. Cover the whole grid to win.',
    ],
    Component: Zip,
  },
]

// score ranges for the synthetic daily rivals (keeps the board lively & fair)
export const RIVAL_RANGE = {
  schulte: [22, 66],
  stroop: [3, 9],
  flash: [3, 11],
  numflash: [1, 5],
  speed: [3, 10],
  truefalse: [3, 9],
  crossmath: [1, 5],
  zip: [28, 82],
}

// Score that counts as a perfect 10-XP run, per game (so XP is a fair 1–10
// scale across games regardless of their internal scoring).
export const XP_MAX = {
  schulte: 70,
  stroop: 10,
  flash: 10,
  numflash: 10,
  speed: 10,
  truefalse: 10,
  crossmath: 5,
  zip: 80,
}

// correctness denominators per game (for "x / total" display)
const TOTALS = { speed: 10, stroop: 10, truefalse: 10, numflash: 10, crossmath: 5 }

function tstr(ms) {
  if (!ms || ms <= 0) return null
  const t = ms / 1000
  return t < 60
    ? `${t.toFixed(t < 10 ? 1 : 0)}s`
    : `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`
}

// Human-meaningful result: { big, sub } for the result screen, board for the
// leaderboard. Shows real time + correctness instead of an abstract score.
export function gameMetrics(gameId, score, ms) {
  const ts = tstr(ms)
  if (gameId === 'schulte') {
    const s = ts || `${(600 / Math.max(score, 1)).toFixed(1)}s`
    return { big: s, sub: 'finished', board: s }
  }
  if (gameId === 'zip') {
    const s = ts || `${Math.max(0, 120 - score)}s`
    return { big: s, sub: 'solved', board: s }
  }
  if (gameId === 'flash') {
    const lv = `Lv ${score + 1}`
    return { big: lv, sub: ts ? `lasted ${ts}` : 'reached', board: lv }
  }
  const total = TOTALS[gameId] || 10
  return {
    big: `${score}/${total}`,
    sub: ts ? `in ${ts}` : 'correct',
    board: ts ? `${score}/${total} · ${ts}` : `${score}/${total}`,
  }
}

export const gameById = (id) => GAMES.find((g) => g.id === id)

// Pin specific dates to a chosen game; every other day rotates automatically.
const FEATURED_OVERRIDES = {
  '2026-06-23': 'flash', // today → Flash Memory
}

// today's featured "Daily Challenge": pinned if set, else rotates by date
export function featuredGame(dateKey) {
  const pin = FEATURED_OVERRIDES[dateKey]
  if (pin) return GAMES.find((g) => g.id === pin) || GAMES[0]
  let h = 0
  for (let i = 0; i < dateKey.length; i++) h = (h * 31 + dateKey.charCodeAt(i)) >>> 0
  return GAMES[h % GAMES.length]
}
