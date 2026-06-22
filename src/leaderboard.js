// Leaderboard persistence. Currently localStorage (per-device).
// Swap these functions for Supabase/REST calls to get a real shared board.
// Ranking metric is NET TIME (lower is better): elapsed + miss penalties.

import { todayKey } from './daily.js'

const LB_KEY = 'schulte.leaderboard'
const PLAYED_KEY = 'schulte.played'
const HANDLE_KEY = 'schulte.handle'
const BEST_KEY = 'schulte.practiceBest'

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

// --- practice personal best (endless mode) ---
export function getPracticeBest() {
  const v = Number(localStorage.getItem(BEST_KEY))
  return Number.isFinite(v) && v > 0 ? v : null
}

export function recordPractice(netMs) {
  const prev = getPracticeBest()
  const improved = prev == null || netMs < prev
  if (improved) localStorage.setItem(BEST_KEY, String(netMs))
  return improved
}

// --- daily ranked attempt ---
export function getTodayResult() {
  try {
    const played = JSON.parse(localStorage.getItem(PLAYED_KEY)) || {}
    return played[todayKey()] || null
  } catch {
    return null
  }
}

export function submitDaily({ netMs, elapsedMs, misses }) {
  const key = todayKey()
  const entry = {
    name: getHandle(),
    netMs,
    elapsedMs,
    misses,
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

// Rank: fastest net time first; ties broken by fewer misses.
function rankSort(a, b) {
  if (a.netMs !== b.netMs) return a.netMs - b.netMs
  return a.misses - b.misses
}

export function getDailyBoard() {
  const key = todayKey()
  return readAll()
    .filter((r) => r.date === key)
    .sort(rankSort)
}

export function getAllTimeBoard() {
  // Best (fastest) run per handle, across all days.
  const best = new Map()
  for (const r of readAll()) {
    const prev = best.get(r.name)
    if (!prev || rankSort(r, prev) < 0) best.set(r.name, r)
  }
  return [...best.values()].sort(rankSort).slice(0, 10)
}
