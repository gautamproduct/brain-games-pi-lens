import { useRef, useState } from 'react'
import { ri, pick } from '../lib/rng.js'
import { useCountdown } from '../lib/useCountdown.js'

// 10 sums, 4-option MCQ, against a 45s clock. Score = correct answers.
const QS = 10
const TOTAL = 45000

export default function SpeedMath({ rng, onFinish }) {
  const makeQ = () => {
    const op = pick(rng, ['+', '−', '×'])
    let a, b, ans
    if (op === '×') { a = ri(rng, 6, 19); b = ri(rng, 3, 9); ans = a * b }
    else if (op === '+') { a = ri(rng, 18, 89); b = ri(rng, 12, 79); ans = a + b }
    else { a = ri(rng, 30, 99); b = ri(rng, 11, 29); ans = a - b }
    const opts = new Set([ans])
    while (opts.size < 4) { const d = ans + ri(rng, -9, 9); if (d >= 0 && d !== ans) opts.add(d) }
    return { text: `${a} ${op} ${b}`, ans, opts: [...opts].sort(() => rng() - 0.5) }
  }

  const [i, setI] = useState(0)
  const [q, setQ] = useState(makeQ)
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
      else { setI(i + 1); setQ(makeQ()); setFb(null) }
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
