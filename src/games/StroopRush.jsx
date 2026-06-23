import { useRef, useState } from 'react'
import { ri, pick } from '../lib/rng.js'

// Tap the INK colour, not the word. 10 questions. Score = correct answers.
const QS = 10

const COLORS = [
  { id: 'red', label: 'Red', hex: '#ff5d6c' },
  { id: 'blue', label: 'Blue', hex: '#4d8cff' },
  { id: 'green', label: 'Green', hex: '#2ee6a6' },
  { id: 'yellow', label: 'Yellow', hex: '#ffd24a' },
  { id: 'purple', label: 'Purple', hex: '#b47bff' },
]

export default function StroopRush({ rng, onFinish }) {
  const makeRound = () => {
    const word = pick(rng, COLORS)
    let ink = pick(rng, COLORS)
    if (rng() < 0.78) while (ink.id === word.id) ink = pick(rng, COLORS)
    const opts = [ink]
    while (opts.length < 4) {
      const c = COLORS[ri(rng, 0, COLORS.length - 1)]
      if (!opts.find((o) => o.id === c.id)) opts.push(c)
    }
    return { word, ink, opts: opts.sort(() => rng() - 0.5) }
  }

  const [i, setI] = useState(0)
  const [round, setRound] = useState(makeRound)
  const [fb, setFb] = useState(null)
  const correctRef = useRef(0)

  function answer(c) {
    if (fb) return
    const ok = c.id === round.ink.id
    if (ok) correctRef.current += 1
    setFb(ok ? 'good' : 'bad')
    setTimeout(() => {
      if (i + 1 >= QS) {
        onFinish({ score: correctRef.current, summary: `${correctRef.current}/${QS} correct` })
      } else {
        setI(i + 1)
        setRound(makeRound())
        setFb(null)
      }
    }, 300)
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

      <div className={`stroop-word-wrap ${fb || ''}`}>
        <div className="stroop-word" style={{ color: round.ink.hex }}>
          {round.word.label}
        </div>
        <div className="stroop-hint">tap the INK colour</div>
      </div>

      <div className="opt-grid">
        {round.opts.map((c) => (
          <button key={c.id} className="opt-btn" onClick={() => answer(c)}>
            <span className="swatch" style={{ background: c.hex }} />
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}
