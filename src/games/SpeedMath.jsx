import { useRef, useState } from 'react'
import { ri, pick } from '../lib/rng.js'

// 10 arithmetic questions, 4-option multiple choice. Score = correct answers.
const QS = 10

export default function SpeedMath({ rng, onFinish }) {
  const makeQ = () => {
    const op = pick(rng, ['+', '−', '×'])
    let a, b, ans
    if (op === '×') {
      a = ri(rng, 6, 19); b = ri(rng, 3, 9); ans = a * b
    } else if (op === '+') {
      a = ri(rng, 18, 89); b = ri(rng, 12, 79); ans = a + b
    } else {
      a = ri(rng, 30, 99); b = ri(rng, 11, 29); ans = a - b
    }
    const opts = new Set([ans])
    while (opts.size < 4) {
      const d = ans + ri(rng, -9, 9)
      if (d >= 0 && d !== ans) opts.add(d)
    }
    return { text: `${a} ${op} ${b}`, ans, opts: [...opts].sort(() => rng() - 0.5) }
  }

  const [i, setI] = useState(0)
  const [q, setQ] = useState(makeQ)
  const [fb, setFb] = useState(null)
  const correctRef = useRef(0)

  function answer(v) {
    if (fb) return
    const ok = v === q.ans
    if (ok) correctRef.current += 1
    setFb({ t: ok ? 'good' : 'bad', v })
    setTimeout(() => {
      if (i + 1 >= QS) {
        onFinish({ score: correctRef.current, summary: `${correctRef.current}/${QS} correct` })
      } else {
        setI(i + 1)
        setQ(makeQ())
        setFb(null)
      }
    }, 380)
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

      <div className="progress sm">
        <div className="progress-fill" style={{ width: `${(i / QS) * 100}%` }} />
      </div>

      <div className={`bigq ${fb ? fb.t : ''}`}>{q.text}</div>

      <div className="opt-grid">
        {q.opts.map((v) => (
          <button
            key={v}
            className={`opt-btn num ${fb && fb.v === v ? fb.t : ''}`}
            onClick={() => answer(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
