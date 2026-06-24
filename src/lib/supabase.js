// Lightweight Supabase logging via the REST API (no SDK dependency).
// Reads keys from build-time env; if they're absent the app simply skips logging.
//   VITE_SUPABASE_URL       e.g. https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY  the public anon key (safe to expose with RLS)

import { todayKey } from './rng.js'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseEnabled = !!(URL && KEY)

// Read helper (GET). Returns [] on any failure (e.g. no SELECT policy yet).
export async function sbSelect(path) {
  if (!supabaseEnabled) return []
  try {
    const r = await fetch(`${URL}/rest/v1/${path}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    })
    if (!r.ok) return []
    return await r.json()
  } catch {
    return []
  }
}

const headers = () => ({
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
})

// Fire-and-forget: records that a user played a game on a given day.
// Includes time (ms) for the speed tiebreak; if the ms column doesn't exist
// yet it retries without it, so logging never breaks.
export async function logPlay({ userId, name, gameId, score, ms }) {
  if (!supabaseEnabled) return
  const base = { user_id: userId, name, game_id: gameId, day: todayKey(), score }
  try {
    const res = await fetch(`${URL}/rest/v1/plays`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ ...base, ms }),
    })
    if (res.ok) return
    await fetch(`${URL}/rest/v1/plays`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(base),
    })
  } catch {
    // network/keys not ready — ignore, the local game is unaffected
  }
}

// Records that a user clicked a share button. kind = 'score' | 'invite'.
export async function logShare({ userId, name, kind }) {
  if (!supabaseEnabled) return
  try {
    await fetch(`${URL}/rest/v1/shares`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ user_id: userId, name, kind, day: todayKey() }),
    })
  } catch {
    // table/keys not ready — ignore
  }
}
