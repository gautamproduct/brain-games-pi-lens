import { useRef, useState } from 'react'
import { ri, pick } from '../lib/rng.js'
import { useCountdown } from '../lib/useCountdown.js'

// 10 sums, 4-option MCQ, 45s. Numbers get harder as you progress.
const QS = 10
const TOTAL = 45000

export default function SpeedMath({ rng, onFinish }) {
  // idx 0..9 → tier ramps up so the last few are noticeably tougher
  const makeQ = (idx) => {
    const tier = idx < 3 ? 0 : idx < 7 ? 1 : 2
    const op = pick(rng, ['+', '−', '×'])
    let a, b, ans
    if (op === '×') {
      if (tier === 0) { a = ri(rng, 6, 12); b = ri(rng, 3, 7) }
      else if (tier === 1) { a = ri(rng, 11, 19); b = ri(rng, 4, 9) }
      else { a = ri(rng, 13, 29); b = ri(rng, 6, 12) }
      ans = a * b
    } else if (op === '+') {
      if (tier === 0) { a = ri(rng, 12, 49); b = ri(rng, 8, 39) }
      else if (tier === 1) { a = ri(rng, 40, 99); b = ri(rng, 25, 89) }
      else { a = ri(rng, 120, 499); b = ri(rng, 80, 399) }
      ans = a + b
    } else {
      // subtraction kept non-negative (a-range min always > b-range max)
      if (tier === 0) { a = ri(rng, 20, 59); b = ri(rng, 8, 19) }
      else if (tier === 1) { a = ri(rng, 55, 99); b = ri(rng, 15, 49) }
      else { a = ri(rng, 220, 599); b = ri(rng, 60, 199) }
      ans = a - b
    }
    const spread = Math.max(4, Math.round(ans * 0.12))
    const opts = new Set([ans])
    while (opts.size < 4) { const d = ans + ri(rng, -spread, spread); if (d >= 0 && d !== ans) opts.add(d) }
    return { text: `${a} ${op} ${b}`, ans, opts: [...opts].sort(() => rng() - 0.5) }
  }

  const [i, setI] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [fb, setFb] = useState(null)
  const correctRef = useRef(0)
  const doneRef = useRef(false)

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    onFinish({ score: correctRef.current, summary: `${correctRef.current}/${QS} correct` })
  }
  const left = useCountdown(TOTAL, true, finish)
  const low = left <= 7000

  function answer(v) {
    if (fb || doneRef.current) return
    const ok = v === q.ans
    if (ok) correctRef.current += 1
    setFb({ t: ok ? 'good' : 'bad', v })
    setTimeout(() => {
      if (i + 1 >= QS) finish()
      else { setI(i + 1); setQ(makeQ(i + 1)); setFb(null) }
    }, 360)
  }

  return (
    <div className="gf">
      <div className="gf-hud">
        <div className="hud-chip"><span className="hud-k">Q {i + 1}/{QS}</span><b className="grad">{correctRef.current}</b></div>
        <div className="hud-chip right"><b className={`hud-time ${low ? 'low' : ''}`}>{(left / 1000).toFixed(0)}s</b><span className="hud-k">time left</span></div>
      </div>
      <div className="timebar"><div className={`timebar-fill ${low ? 'low' : ''}`} style={{ width: `${(left / TOTAL) * 100}%` }} /></div>

      <div className={`bigq ${fb ? fb.t : ''}`}>{q.text}</div>
      <div className="opt-grid">
        {q.opts.map((v) => (
          <button key={v} className={`opt-btn num ${fb && fb.v === v ? fb.t : ''}`} onClick={() => answer(v)}>{v}</button>
        ))}
      </div>
    </div>
  )
}
