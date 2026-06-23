import { useRef, useState } from 'react'
import { ri, pick } from '../lib/rng.js'
import { useCountdown } from '../lib/useCountdown.js'

// Is the equation correct? 10 questions against a 35s clock.
const QS = 10
const TOTAL = 35000

export default function TrueFalse({ rng, onFinish }) {
  const makeQ = () => {
    const op = pick(rng, ['+', '−', '×'])
    let a, b, real
    if (op === '×') { a = ri(rng, 4, 15); b = ri(rng, 3, 12); real = a * b }
    else if (op === '+') { a = ri(rng, 14, 89); b = ri(rng, 9, 69); real = a + b }
    else { a = ri(rng, 20, 99); b = ri(rng, 8, 39); real = a - b }
    const isTrue = rng() < 0.5
    const shown = isTrue ? real : real + (rng() < 0.5 ? 1 : -1) * ri(rng, 1, 6)
    return { text: `${a} ${op} ${b} = ${shown}`, isTrue }
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
  const low = left <= 6000

  function answer(saysTrue) {
    if (fb || doneRef.current) return
    const ok = saysTrue === q.isTrue
    if (ok) correctRef.current += 1
    setFb(ok ? 'good' : 'bad')
    setTimeout(() => {
      if (i + 1 >= QS) finish()
      else { setI(i + 1); setQ(makeQ()); setFb(null) }
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
