import { useRef, useState } from 'react'
import { ri, pick } from '../lib/rng.js'
import { useCountdown } from '../lib/useCountdown.js'

// 45s arithmetic sprint, 4-option multiple choice (no keyboard needed).
export default function SpeedMath({ rng, onFinish }) {
  const makeQ = () => {
    const op = pick(rng, ['+', '−', '×'])
    let a, b, ans
    if (op === '×') {
      a = ri(rng, 6, 19)
      b = ri(rng, 3, 9)
      ans = a * b
    } else if (op === '+') {
      a = ri(rng, 18, 89)
      b = ri(rng, 12, 79)
      ans = a + b
    } else {
      a = ri(rng, 30, 99)
      b = ri(rng, 11, 29)
      ans = a - b
    }
    const opts = new Set([ans])
    while (opts.size < 4) {
      const d = ans + ri(rng, -9, 9)
      if (d >= 0 && d !== ans) opts.add(d)
    }
    return { text: `${a} ${op} ${b}`, ans, opts: [...opts].sort(() => rng() - 0.5) }
  }

  const [q, setQ] = useState(makeQ)
  const [score, setScore] = useState(0)
  const [fb, setFb] = useState(null)
  const correctRef = useRef(0)
  const comboRef = useRef(0)

  const left = useCountdown(45000, true, () =>
    onFinish({ score, summary: `${correctRef.current} solved` }),
  )

  function answer(v) {
    if (v === q.ans) {
      comboRef.current += 1
      correctRef.current += 1
      setScore((s) => s + 1)
      setFb({ t: 'good', v })
    } else {
      comboRef.current = 0
      setFb({ t: 'bad', v })
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
          <span className="hud-k">{comboRef.current > 1 ? `🔥 x${comboRef.current}` : 'solve fast'}</span>
        </div>
      </div>

      <div className={`bigq ${fb ? fb.t : ''}`}>{q.text}</div>

      <div className="opt-grid">
        {q.opts.map((v) => (
          <button key={v} className="opt-btn num" onClick={() => answer(v)}>
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
