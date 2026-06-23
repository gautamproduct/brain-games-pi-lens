import { useRef, useState } from 'react'
import { ri, pick } from '../lib/rng.js'
import { useCountdown } from '../lib/useCountdown.js'

// Is the equation correct? Rapid yes/no. Attention + quick mental check.
export default function TrueFalse({ rng, onFinish }) {
  const makeQ = () => {
    const op = pick(rng, ['+', '−', '×'])
    let a, b, real
    if (op === '×') {
      a = ri(rng, 4, 15)
      b = ri(rng, 3, 12)
      real = a * b
    } else if (op === '+') {
      a = ri(rng, 14, 89)
      b = ri(rng, 9, 69)
      real = a + b
    } else {
      a = ri(rng, 20, 99)
      b = ri(rng, 8, 39)
      real = a - b
    }
    const isTrue = rng() < 0.5
    const shown = isTrue ? real : real + (rng() < 0.5 ? 1 : -1) * ri(rng, 1, 6)
    return { text: `${a} ${op} ${b} = ${shown}`, isTrue }
  }

  const [q, setQ] = useState(makeQ)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [fb, setFb] = useState(null)
  const correctRef = useRef(0)

  const left = useCountdown(30000, true, () =>
    onFinish({ score, summary: `${correctRef.current} correct` }),
  )

  function answer(saysTrue) {
    if (saysTrue === q.isTrue) {
      const nc = combo + 1
      setCombo(nc)
      correctRef.current += 1
      setScore((s) => s + 12 + Math.min(nc, 10) * 2)
      setFb('good')
    } else {
      setCombo(0)
      setFb('bad')
    }
    setTimeout(() => setFb(null), 140)
    setQ(makeQ())
  }

  return (
    <div className="gf">
      <div className="gf-hud">
        <div className="hud-chip">
          <span className="hud-k">SCORE</span>
          <b className="grad">{score}</b>
        </div>
        <div className="hud-chip right">
          <b>{(left / 1000).toFixed(0)}s</b>
          <span className="hud-k">{combo > 1 ? `🔥 x${combo}` : 'true or false?'}</span>
        </div>
      </div>

      <div className={`bigq ${fb || ''}`}>{q.text}</div>

      <div className="tf-row">
        <button className="tf-btn no" onClick={() => answer(false)}>
          ✗ False
        </button>
        <button className="tf-btn yes" onClick={() => answer(true)}>
          ✓ True
        </button>
      </div>
    </div>
  )
}
