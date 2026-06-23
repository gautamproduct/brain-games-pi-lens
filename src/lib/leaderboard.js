// Real, cross-device leaderboards backed by Supabase (falls back to the local
// board when Supabase isn't configured or hasn't been granted SELECT yet).

import { supabaseEnabled, sbSelect } from './supabase.js'
import { getBoard, getOverallBoard, getUserId, myName } from './store.js'
import { todayKey } from './rng.js'

const mapLocal = (rows) =>
  rows.map((r) => ({ name: r.name, score: r.score, uid: r.name, me: r.name === myName() }))

function bestPerUser(rows) {
  const m = new Map()
  for (const r of rows) {
    const k = r.user_id || r.name
    const prev = m.get(k)
    if (!prev || r.score > prev.score) m.set(k, { name: r.name, score: r.score, uid: k })
  }
  return [...m.values()]
}

// Top scores for one game (best per player). scope: 'today' | 'all'
export async function gameBoard(gameId, scope = 'today') {
  if (!supabaseEnabled) return mapLocal(getBoard(gameId, scope))
  const f = scope === 'today' ? `&day=eq.${todayKey()}` : ''
  const rows = await sbSelect(
    `plays?select=user_id,name,score&game_id=eq.${gameId}${f}&order=score.desc&limit=600`,
  )
  if (!rows.length) return mapLocal(getBoard(gameId, scope)) // policy not set yet / empty
  const me = getUserId()
  return bestPerUser(rows)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map((r) => ({ ...r, me: r.uid === me }))
}

// Overall board: sum of each player's best score per game. scope: 'today' | 'all'
export async function overallBoard(scope = 'today') {
  if (!supabaseEnabled) return mapLocal(getOverallBoard())
  const f = scope === 'today' ? `day=eq.${todayKey()}&` : ''
  const rows = await sbSelect(`plays?select=user_id,name,game_id,score&${f}order=score.desc&limit=4000`)
  if (!rows.length) return mapLocal(getOverallBoard())
  const bestNG = new Map() // uid|game -> {name,score}
  for (const r of rows) {
    const uid = r.user_id || r.name
    const k = uid + '|' + r.game_id
    const p = bestNG.get(k)
    if (!p || r.score > p.score) bestNG.set(k, { name: r.name, uid, score: r.score })
  }
  const tot = new Map()
  for (const v of bestNG.values()) {
    const t = tot.get(v.uid) || { name: v.name, uid: v.uid, score: 0 }
    t.score += v.score
    t.name = v.name
    tot.set(v.uid, t)
  }
  const me = getUserId()
  return [...tot.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map((r) => ({ ...r, me: r.uid === me }))
}

// the player's overall daily rank (1-based), or null
export async function myDailyRank() {
  const board = await overallBoard('today')
  const i = board.findIndex((r) => r.me)
  return i === -1 ? null : i + 1
}
