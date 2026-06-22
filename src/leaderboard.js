// Leaderboard persistence. Currently localStorage (per-device).
// Swap these functions for Supabase/REST calls to get a real shared board.

import { todayKey } from './daily.js'

const LB_KEY = 'speedmath.leaderboard'
const PLAYED_KEY = 'speedmath.played'
const HANDLE_KEY = 'speedmath.handle'

// No name is ever asked. Each device gets a random anonymous handle on first
// play so the leaderboard is readable without any sign-up friction.
const ADJ = [
  'Quick', 'Sharp', 'Swift', 'Cosmic', 'Turbo', 'Prime', 'Atomic', 'Rapid',
  'Stellar', 'Mega', 'Hyper', 'Nova', 'Sonic', 'Laser', 'Pixel', 'Vivid',
]
const NOUN = [
  'Fox', 'Owl', 'Tiger', 'Falcon', 'Comet', 'Bolt', 'Shark', 'Eagle',
  'Panther', 'Phoenix', 'Wolf', 'Lynx', 'Raven', 'Cobra', 'Hawk', 'Orca',
]

export function getHandle() {
  let h = localStorage.getItem(HANDLE_KEY)
  if (!h) {
    const a = ADJ[Math.floor(Math.random() * ADJ.length)]
    const n = NOUN[Math.floor(Math.random() * NOUN.length)]
    h = `${a} ${n} ${Math.floor(10 + Math.random() * 90)}`
    localStorage.setItem(HANDLE_KEY, h)
  }
  return h
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(LB_KEY)) || []
  } catch {
    return []
  }
}

function writeAll(rows) {
  localStorage.setItem(LB_KEY, JSON.stringify(rows))
}

// Has this device already played today?
export function getTodayResult() {
  try {
    const played = JSON.parse(localStorage.getItem(PLAYED_KEY)) || {}
    return played[todayKey()] || null
  } catch {
    return null
  }
}

export function submitScore({ score, correct, timeMs }) {
  const key = todayKey()
  const entry = {
    name: getHandle(),
    score,
    correct,
    timeMs,
    date: key,
    ts: Date.now(),
  }

  const rows = readAll()
  rows.push(entry)
  writeAll(rows)

  const played = (() => {
    try {
      return JSON.parse(localStorage.getItem(PLAYED_KEY)) || {}
    } catch {
      return {}
    }
  })()
  played[key] = entry
  localStorage.setItem(PLAYED_KEY, JSON.stringify(played))

  return entry
}

// Rank: higher score first, then faster time.
function rankSort(a, b) {
  if (b.score !== a.score) return b.score - a.score
  return a.timeMs - b.timeMs
}

export function getDailyBoard() {
  const key = todayKey()
  return readAll()
    .filter((r) => r.date === key)
    .sort(rankSort)
}

export function getAllTimeBoard() {
  // Best single run per handle, across all days.
  const best = new Map()
  for (const r of readAll()) {
    const prev = best.get(r.name)
    if (!prev || rankSort(r, prev) < 0) best.set(r.name, r)
  }
  return [...best.values()].sort(rankSort).slice(0, 10)
}
