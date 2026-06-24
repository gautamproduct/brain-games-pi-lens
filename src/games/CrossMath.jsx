import { useRef, useState } from 'react'
import { ri, pick, shuffle } from '../lib/rng.js'
import { useCountdown } from '../lib/useCountdown.js'

// A cross of equations with one missing number. Fill it so the row AND
// column it sits in both work out. 5 puzzles against a 50s clock.
const PUZZLES = 5
const TOTAL = 50000

const apply = (a, op, b) => (op === '+' ? a + b : op === '−' ? a - b : a * b)

function genPuzzle(rng, idx = 0) {
  const max = idx < 2 ? 7 : idx < 4 ? 9 : 12 // later puzzles use bigger numbers
  const num = () => ri(rng, 1, max)
  const opFor = (a, b) => {
    const cand = ['+', '×']
    if (a >= b) cand.push('−')
    return pick(rng, cand)
  }
  const n11 = num(), n12 = num(), n21 = num(), n22 = num()
  const op1 = opFor(n11, n12), op4 = opFor(n21, n22)
  const op2 = opFor(n11, n21), op3 = opFor(n12, n22)
  const nums = { n11, n12, n21, n22 }
  const hideKey = pick(rng, ['n11', 'n12', 'n21', 'n22'])
  const ans = nums[hideKey]
  const set = new Set([ans])
  while (set.size < 4) {
    const d = ans + ri(rng, -3, 3)
    if (d > 0 && d !== ans) set.add(d)
  }
  return {
    n11, n12, n21, n22, op1, op2, op3, op4,
    r1: apply(n11, op1, n12),
    r2: apply(n21, op4, n22),
    c1: apply(n11, op2, n21),
    c2: apply(n12, op3, n22),
    hideKey,
    ans,
    opts: shuffle(rng, [...set]),
  }
}

export default function CrossMath({ rng, onFinish }) {
  const [i, setI] = useState(0)
  const [p, setP] = useState(() => genPuzzle(rng, 0))
  const [fb, setFb] = useState(null)
  const correctRef = useRef(0)
  const doneRef = useRef(false)

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    onFinish({ score: correctRef.current, summary: `${correctRef.current}/${PUZZLES} solved` })
  }
  const left = useCountdown(TOTAL, true, finish)
  const low = left <= 8000

  function answer(v) {
    if (fb || doneRef.current) return
    const ok = v === p.ans
    if (ok) correctRef.current += 1
    setFb({ v, ok })
    setTimeout(() => {
      if (i + 1 >= PUZZLES) finish()
      else { setI(i + 1); setP(genPuzzle(rng, i + 1)); setFb(null) }
    }, 750)
  }

  const cell = (key) =>
    p.hideKey === key ? (
      fb ? (
        <span className={fb.ok ? 'cm-fill ok' : 'cm-fill no'}>{p.ans}</span>
      ) : (
        <span className="cm-q">?</span>
      )
    ) : (
      <span>{p[key]}</span>
    )

  return (
    <div className={`gf ${low ? 'time-low' : ''}`}>
      <div className="gf-hud">
        <div className="hud-chip">
          <span className="hud-k">PUZZLE {i + 1}/{PUZZLES}</span>
          <b className="grad">{correctRef.current}</b>
        </div>
        <div className="hud-chip right">
          <b className={`hud-time ${low ? 'low' : ''}`}>{(left / 1000).toFixed(0)}s</b>
          <span className="hud-k">time left</span>
        </div>
      </div>
      <div className="timebar"><div className={`timebar-fill ${low ? 'low' : ''}`} style={{ width: `${(left / TOTAL) * 100}%` }} /></div>

      <div className="cm-wrap">
        <div className="cmgrid">
          <div className="cm-cell num">{cell('n11')}</div>
          <div className="cm-op">{p.op1}</div>
          <div className="cm-cell num">{cell('n12')}</div>
          <div className="cm-op">=</div>
          <div className="cm-cell res">{p.r1}</div>

          <div className="cm-op">{p.op2}</div>
          <div /><div className="cm-op">{p.op3}</div>
          <div /><div />

          <div className="cm-cell num">{cell('n21')}</div>
          <div className="cm-op">{p.op4}</div>
          <div className="cm-cell num">{cell('n22')}</div>
          <div className="cm-op">=</div>
          <div className="cm-cell res">{p.r2}</div>

          <div className="cm-op">=</div>
          <div /><div className="cm-op">=</div>
          <div /><div />

          <div className="cm-cell res">{p.c1}</div>
          <div /><div className="cm-cell res">{p.c2}</div>
          <div /><div />
        </div>
      </div>

      <div className="cm-ask">Tap the missing number</div>
      <div className="opt-grid">
        {p.opts.map((v) => (
          <button
            key={v}
            className={`opt-btn num ${fb && fb.v === v ? (fb.ok ? 'good' : 'bad') : ''}`}
            onClick={() => answer(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
