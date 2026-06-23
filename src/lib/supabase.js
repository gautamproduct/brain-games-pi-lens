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

// Fire-and-forget: records that a user played a game on a given day.
export async function logPlay({ userId, name, gameId, score }) {
  if (!supabaseEnabled) return
  try {
    await fetch(`${URL}/rest/v1/plays`, {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        user_id: userId,
        name,
        game_id: gameId,
        day: todayKey(),
        score,
      }),
    })
  } catch {
    // network/keys not ready — ignore, the local game is unaffected
  }
}
