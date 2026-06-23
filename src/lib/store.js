// All persistence (localStorage). No accounts, no login.
// Holds the player profile (name, XP, level, streak) and per-game leaderboards.

import { todayKey, makeRng, hashStr } from './rng.js'
import { RIVAL_RANGE } from '../games/index.js'

// Synthetic opponents so the board is always populated and the numbers shift
// every day (seeded by date+game → deterministic, covers any day ahead).
const RIVAL_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Sai', 'Reyansh', 'Ishaan', 'Rohan',
  'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Riya', 'Neha', 'Priya', 'Karan',
  'Rahul', 'Sneha', 'Meera', 'Kabir', 'Dev', 'Tara', 'Aryan', 'Nikhil',
  'Pooja', 'Simran', 'Manish', 'Tanya', 'Yash', 'Isha',
]

function dailyRivals(gameId, day) {
  const range = RIVAL_RANGE[gameId] || [1, 9]
  const rng = makeRng(`rivals:${gameId}:${day}`)
  const n = 5 + Math.floor(rng() * 4) // 5–8 rivals
  const used = new Set()
  const out = []
  for (let k = 0; k < n; k++) {
    let name = RIVAL_NAMES[Math.floor(rng() * RIVAL_NAMES.length)]
    if (used.has(name)) name = `${name} ${2 + Math.floor(rng() * 7)}`
    used.add(name)
    const [lo, hi] = range
    out.push({
      name,
      score: lo + Math.floor(rng() * (hi - lo + 1)),
      day,
      ts: hashStr(name + day + gameId),
      rival: true,
    })
  }
  return out
}

const PROFILE_KEY = 'bg.profile'
const SCORES_KEY = 'bg.scores'

function read(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return v == null ? fallback : v
  } catch {
    return fallback
  }
}
function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

// ---------- profile / gamification ----------
const FRESH = { name: '', xp: 0, streak: 0, lastDay: '', plays: 0, best: {} }

export function getProfile() {
  return { ...FRESH, ...read(PROFILE_KEY, {}) }
}

export function hasName() {
  return !!getProfile().name
}

export function setName(name) {
  const p = getProfile()
  p.name = name.trim().slice(0, 16) || 'Player'
  write(PROFILE_KEY, p)
  return p
}

// XP curve: level N needs 50 * N^2 total xp.
export function levelFromXp(xp) {
  return Math.floor(Math.sqrt(xp / 50)) + 1
}
export function levelProgress(xp) {
  const lvl = levelFromXp(xp)
  const cur = 50 * (lvl - 1) ** 2
  const next = 50 * lvl ** 2
  return { lvl, cur: xp - cur, span: next - cur, pct: ((xp - cur) / (next - cur)) * 100 }
}

const yesterdayKey = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return todayKey(d)
}

// Call once per finished game. Awards XP and keeps the daily streak alive.
export function finishSession(gameId, score, xpGain) {
  const p = getProfile()
  const today = todayKey()
  if (p.lastDay !== today) {
    p.streak = p.lastDay === yesterdayKey() ? p.streak + 1 : 1
    p.lastDay = today
  }
  p.xp += Math.max(0, Math.round(xpGain))
  p.plays += 1
  if (!p.best[gameId] || score > p.best[gameId]) p.best[gameId] = score
  write(PROFILE_KEY, p)
  return p
}

// ---------- leaderboards ----------
export function recordScore(gameId, score, summary) {
  const name = getProfile().name || 'Player'
  const rows = read(SCORES_KEY, [])
  rows.push({ gameId, name, score, summary, day: todayKey(), ts: Date.now() })
  write(SCORES_KEY, rows)
}

// best score per name for a game, today or all-time
export function getBoard(gameId, scope = 'today') {
  const rows = read(SCORES_KEY, []).filter((r) => r.gameId === gameId)
  const filtered = scope === 'today' ? rows.filter((r) => r.day === todayKey()) : rows
  const best = new Map()
  for (const r of filtered) {
    const prev = best.get(r.name)
    if (!prev || r.score > prev.score) best.set(r.name, r)
  }
  // blend in today's rivals so the board is lively and shifts each day
  for (const rv of dailyRivals(gameId, todayKey())) {
    const prev = best.get(rv.name)
    if (!prev || rv.score > prev.score) best.set(rv.name, rv)
  }
  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, 20)
}

// overall board: total of each player's best score across all games
export function getOverallBoard() {
  const profiles = new Map()
  const rows = read(SCORES_KEY, [])
  const bestByNameGame = new Map()
  for (const r of rows) {
    const k = r.name + '|' + r.gameId
    if (!bestByNameGame.has(k) || r.score > bestByNameGame.get(k)) {
      bestByNameGame.set(k, r.score)
    }
  }
  for (const [k, score] of bestByNameGame) {
    const name = k.split('|')[0]
    profiles.set(name, (profiles.get(name) || 0) + score)
  }
  // add rivals' totals across all games for today
  for (const gid of Object.keys(RIVAL_RANGE)) {
    for (const rv of dailyRivals(gid, todayKey())) {
      profiles.set(rv.name, (profiles.get(rv.name) || 0) + rv.score)
    }
  }
  return [...profiles.entries()]
    .map(([name, total]) => ({ name, score: total }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
}

export function myName() {
  return getProfile().name || 'Player'
}

// game ids the current player has already completed today (for "done" ticks)
export function playedTodayIds() {
  const me = myName()
  const today = todayKey()
  const s = new Set()
  for (const r of read(SCORES_KEY, [])) {
    if (r.day === today && r.name === me) s.add(r.gameId)
  }
  return s
}

// the player's rank (1-based) in today's board for a game, or null
export function myRankToday(gameId) {
  const me = myName()
  const board = getBoard(gameId, 'today')
  const i = board.findIndex((r) => r.name === me)
  return i === -1 ? null : i + 1
}
