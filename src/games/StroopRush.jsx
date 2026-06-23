import { useRef, useState } from 'react'
import { ri, pick } from '../lib/rng.js'
import { useCountdown } from '../lib/useCountdown.js'

const COLORS = [
  { id: 'red', label: 'Red', hex: '#ff5d6c' },
  { id: 'blue', label: 'Blue', hex: '#4d8cff' },
  { id: 'green', label: 'Green', hex: '#2ee6a6' },
  { id: 'yellow', label: 'Yellow', hex: '#ffd24a' },
  { id: 'purple', label: 'Purple', hex: '#b47bff' },
]

// Tap the INK color, not the word. Focus & impulse-control under time pressure.
export default function StroopRush({ rng, onFinish }) {
  const makeRound = () => {
    const word = pick(rng, COLORS)
    let ink = pick(rng, COLORS)
    if (rng() < 0.75) while (ink.id === word.id) ink = pick(rng, COLORS) // mostly mismatched
    const opts = [ink]
    while (opts.length < 4) {
      const c = COLORS[ri(rng, 0, COLORS.length - 1)]
      if (!opts.find((o) => o.id === c.id)) opts.push(c)
    }
    return { word, ink, opts: opts.sort(() => rng() - 0.5) }
  }

  const [round, setRound] = useState(makeRound)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [fb, setFb] = useState(null)
  const correctRef = useRef(0)
  const maxComboRef = useRef(0)

  const left = useCountdown(30000, true, () =>
    onFinish({
      score,
      summary: `${correctRef.current} correct · x${maxComboRef.current} combo`,
    }),
  )

  function answer(c) {
    if (c.id === round.ink.id) {
      const nc = combo + 1
      setCombo(nc)
      maxComboRef.current = Math.max(maxComboRef.current, nc)
      correctRef.current += 1
      setScore((s) => s + 10 + Math.min(nc, 10) * 2)
      setFb('good')
    } else {
      setCombo(0)
      setFb('bad')
    }
    setTimeout(() => setFb(null), 160)
    setRound(makeRound())
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
          <span className="hud-k">{combo > 1 ? `🔥 x${combo}` : 'combo'}</span>
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
