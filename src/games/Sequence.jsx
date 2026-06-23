import { useRef, useState } from 'react'
import { ri, pick } from '../lib/rng.js'
import { useCountdown } from '../lib/useCountdown.js'

// What comes next? Pattern recognition + reasoning under time.
export default function Sequence({ rng, onFinish }) {
  const makeQ = () => {
    const kind = pick(rng, ['add', 'mul', 'square', 'alt'])
    let seq = []
    let ans
    if (kind === 'add') {
      const start = ri(rng, 1, 9)
      const step = ri(rng, 2, 9)
      seq = [start, start + step, start + 2 * step, start + 3 * step]
      ans = start + 4 * step
    } else if (kind === 'mul') {
      const start = ri(rng, 1, 4)
      const r = ri(rng, 2, 3)
      seq = [start, start * r, start * r * r, start * r ** 3]
      ans = start * r ** 4
    } else if (kind === 'square') {
      const s = ri(rng, 1, 4)
      seq = [s * s, (s + 1) ** 2, (s + 2) ** 2, (s + 3) ** 2]
      ans = (s + 4) ** 2
    } else {
      const a = ri(rng, 2, 8)
      const d = ri(rng, 1, 5)
      seq = [a, a + d, a + d, a + 2 * d] // gentle alternating-ish
      ans = a + 2 * d + d
    }
    const opts = new Set([ans])
    while (opts.size < 4) {
      const o = ans + ri(rng, -6, 6) * (rng() < 0.5 ? 1 : 2)
      if (o > 0 && o !== ans) opts.add(o)
    }
    return { seq, ans, opts: [...opts].sort(() => rng() - 0.5) }
  }

  const [q, setQ] = useState(makeQ)
  const [score, setScore] = useState(0)
  const [fb, setFb] = useState(null)
  const correctRef = useRef(0)

  const left = useCountdown(60000, true, () =>
    onFinish({ score, summary: `${correctRef.current} solved` }),
  )

  function answer(v) {
    if (v === q.ans) {
      correctRef.current += 1
      setScore((s) => s + 1)
      setFb({ t: 'good', v })
    } else {
      setFb({ t: 'bad', v })
    }
    setTimeout(() => setFb(null), 160)
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
          <span className="hud-k">find the pattern</span>
        </div>
      </div>

      <div className="seq-line">
        {q.seq.map((n, i) => (
          <span key={i} className="seq-num">
            {n}
          </span>
        ))}
        <span className="seq-num q">?</span>
      </div>

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
