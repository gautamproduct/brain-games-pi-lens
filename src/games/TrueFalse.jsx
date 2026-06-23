import { useRef, useState } from 'react'
import { ri, pick } from '../lib/rng.js'

// Is the equation correct? Rapid yes/no, 10 questions. Score = correct answers.
const QS = 10

export default function TrueFalse({ rng, onFinish }) {
  const makeQ = () => {
    const op = pick(rng, ['+', '−', '×'])
    let a, b, real
    if (op === '×') {
      a = ri(rng, 4, 15); b = ri(rng, 3, 12); real = a * b
    } else if (op === '+') {
      a = ri(rng, 14, 89); b = ri(rng, 9, 69); real = a + b
    } else {
      a = ri(rng, 20, 99); b = ri(rng, 8, 39); real = a - b
    }
    const isTrue = rng() < 0.5
    const shown = isTrue ? real : real + (rng() < 0.5 ? 1 : -1) * ri(rng, 1, 6)
    return { text: `${a} ${op} ${b} = ${shown}`, isTrue }
  }

  const [i, setI] = useState(0)
  const [q, setQ] = useState(makeQ)
  const [fb, setFb] = useState(null)
  const correctRef = useRef(0)

  function answer(saysTrue) {
    if (fb) return
    const ok = saysTrue === q.isTrue
    if (ok) correctRef.current += 1
    setFb(ok ? 'good' : 'bad')
    setTimeout(() => {
      if (i + 1 >= QS) {
        onFinish({ score: correctRef.current, summary: `${correctRef.current}/${QS} correct` })
      } else {
        setI(i + 1)
        setQ(makeQ())
        setFb(null)
      }
    }, 320)
  }

  return (
    <div className="gf">
      <div className="gf-hud">
        <div className="hud-chip">
          <span className="hud-k">QUESTION</span>
          <b className="grad">{i + 1}/{QS}</b>
        </div>
        <div className="hud-chip right">
          <b>{correctRef.current}</b>
          <span className="hud-k">correct</span>
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
