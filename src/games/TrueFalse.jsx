import { useRef, useState } from 'react'
import { ri, pick } from '../lib/rng.js'
import { useCountdown } from '../lib/useCountdown.js'

// Is the equation correct? 10 questions, 35s. Numbers ramp up toward the end.
const QS = 10
const TOTAL = 35000

export default function TrueFalse({ rng, onFinish }) {
  const makeQ = (idx) => {
    const tier = idx < 3 ? 0 : idx < 7 ? 1 : 2
    const op = pick(rng, ['+', '−', '×'])
    let a, b, real
    if (op === '×') {
      if (tier === 0) { a = ri(rng, 3, 9); b = ri(rng, 3, 7) }
      else if (tier === 1) { a = ri(rng, 6, 15); b = ri(rng, 4, 9) }
      else { a = ri(rng, 12, 24); b = ri(rng, 6, 12) }
      real = a * b
    } else if (op === '+') {
      if (tier === 0) { a = ri(rng, 12, 49); b = ri(rng, 8, 39) }
      else if (tier === 1) { a = ri(rng, 30, 99); b = ri(rng, 20, 79) }
      else { a = ri(rng, 150, 599); b = ri(rng, 80, 399) }
      real = a + b
    } else {
      if (tier === 0) { a = ri(rng, 20, 59); b = ri(rng, 8, 19) }
      else if (tier === 1) { a = ri(rng, 55, 99); b = ri(rng, 15, 49) }
      else { a = ri(rng, 220, 599); b = ri(rng, 60, 199) }
      real = a - b
    }
    const isTrue = rng() < 0.5
    const off = ri(rng, 1, Math.max(4, Math.round(real * 0.06)))
    const shown = isTrue ? real : real + (rng() < 0.5 ? 1 : -1) * off
    return { text: `${a} ${op} ${b} = ${shown}`, isTrue }
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
  const low = left <= 6000

  function answer(saysTrue) {
    if (fb || doneRef.current) return
    const ok = saysTrue === q.isTrue
    if (ok) correctRef.current += 1
    setFb(ok ? 'good' : 'bad')
    setTimeout(() => {
      if (i + 1 >= QS) finish()
      else { setI(i + 1); setQ(makeQ(i + 1)); setFb(null) }
    }, 320)
  }

  return (
    <div className="gf">
      <div className="gf-hud">
        <div className="hud-chip"><span className="hud-k">Q {i + 1}/{QS}</span><b className="grad">{correctRef.current}</b></div>
        <div className="hud-chip right"><b className={`hud-time ${low ? 'low' : ''}`}>{(left / 1000).toFixed(0)}s</b><span className="hud-k">time left</span></div>
      </div>
      <div className="timebar"><div className={`timebar-fill ${low ? 'low' : ''}`} style={{ width: `${(left / TOTAL) * 100}%` }} /></div>

      <div className={`bigq ${fb || ''}`}>{q.text}</div>
      <div className="tf-row">
        <button className="tf-btn no" onClick={() => answer(false)}>✗ False</button>
        <button className="tf-btn yes" onClick={() => answer(true)}>✓ True</button>
      </div>
    </div>
  )
}
