// Real, cross-device leaderboards backed by Supabase (falls back to the local
// board when Supabase isn't configured). Cached briefly so switching tabs and
// re-opening the board is instant instead of re-fetching every time.

import { supabaseEnabled, sbSelect } from './supabase.js'
import { getBoard, getOverallBoard, getUserId, myName } from './store.js'
import { todayKey } from './rng.js'
import { XP_MAX } from '../games/index.js'

// each game contributes at most 10 to the overall total (fair across games)
const norm10 = (gameId, score) => Math.min(10, Math.round((score / (XP_MAX[gameId] || 10)) * 10))

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

const _cache = new Map() // key -> { t, data }
const TTL = 25000
async function cached(key, fn) {
  const hit = _cache.get(key)
  if (hit && Date.now() - hit.t < TTL) return hit.data
  const data = await fn()
  _cache.set(key, { t: Date.now(), data })
  return data
}
export function clearBoardCache() {
  _cache.clear()
}

export async function gameBoard(gameId, scope = 'today') {
  if (!supabaseEnabled) return mapLocal(getBoard(gameId, scope))
  return cached(`g:${gameId}:${scope}:${todayKey()}`, async () => {
    const f = scope === 'today' ? `&day=eq.${todayKey()}` : ''
    const rows = await sbSelect(
      `plays?select=user_id,name,score&game_id=eq.${gameId}${f}&order=score.desc&limit=400`,
    )
    const me = getUserId()
    return bestPerUser(rows)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((r) => ({ ...r, me: r.uid === me }))
  })
}

export async function overallBoard(scope = 'today') {
  if (!supabaseEnabled) return mapLocal(getOverallBoard())
  return cached(`o:${scope}:${todayKey()}`, async () => {
    const f = scope === 'today' ? `day=eq.${todayKey()}&` : ''
    const rows = await sbSelect(`plays?select=user_id,name,game_id,score&${f}order=score.desc&limit=2000`)
    const bestNG = new Map()
    for (const r of rows) {
      const uid = r.user_id || r.name
      const k = uid + '|' + r.game_id
      const p = bestNG.get(k)
      if (!p || r.score > p.score) bestNG.set(k, { name: r.name, uid, gameId: r.game_id, score: r.score })
    }
    const tot = new Map()
    for (const v of bestNG.values()) {
      const t = tot.get(v.uid) || { name: v.name, uid: v.uid, score: 0 }
      t.score += norm10(v.gameId, v.score) // normalized: each game max 10
      t.name = v.name
      tot.set(v.uid, t)
    }
    const me = getUserId()
    return [...tot.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((r) => ({ ...r, me: r.uid === me }))
  })
}

export async function myDailyRank() {
  const board = await overallBoard('today')
  const i = board.findIndex((r) => r.me)
  return i === -1 ? null : i + 1
}
