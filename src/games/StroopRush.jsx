import { useRef, useState } from 'react'
import { ri, pick } from '../lib/rng.js'
import { useCountdown } from '../lib/useCountdown.js'

// Tap the INK colour, not the word. 10 questions against a 35s clock.
const QS = 10
const TOTAL = 35000

const COLORS = [
  { id: 'red', label: 'Red', hex: '#ff5d6c' },
  { id: 'blue', label: 'Blue', hex: '#4d8cff' },
  { id: 'green', label: 'Green', hex: '#2ee6a6' },
  { id: 'yellow', label: 'Yellow', hex: '#ffd24a' },
  { id: 'purple', label: 'Purple', hex: '#b47bff' },
]

export default function StroopRush({ rng, onFinish }) {
  const makeRound = (idx) => {
    const mismatchP = 0.7 + idx * 0.03 // later rounds almost always mismatch
    const word = pick(rng, COLORS)
    let ink = pick(rng, COLORS)
    if (rng() < mismatchP) while (ink.id === word.id) ink = pick(rng, COLORS)
    const opts = [ink]
    // tempt the player with the colour the WORD names (the Stroop trap)
    if (word.id !== ink.id) opts.push(word)
    while (opts.length < 4) {
      const c = COLORS[ri(rng, 0, COLORS.length - 1)]
      if (!opts.find((o) => o.id === c.id)) opts.push(c)
    }
    return { word, ink, opts: opts.sort(() => rng() - 0.5) }
  }

  const [i, setI] = useState(0)
  const [round, setRound] = useState(() => makeRound(0))
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

  function answer(c) {
    if (fb || doneRef.current) return
    const ok = c.id === round.ink.id
    if (ok) correctRef.current += 1
    setFb(ok ? 'good' : 'bad')
    setTimeout(() => {
      if (i + 1 >= QS) finish()
      else { setI(i + 1); setRound(makeRound(i + 1)); setFb(null) }
    }, 300)
  }

  return (
    <div className={`gf ${low ? 'time-low' : ''}`}>
      <div className="gf-hud">
        <div className="hud-chip"><span className="hud-k">Q {i + 1}/{QS}</span><b className="grad">{correctRef.current}</b></div>
        <div className="hud-chip right"><b className={`hud-time ${low ? 'low' : ''}`}>{(left / 1000).toFixed(0)}s</b><span className="hud-k">time left</span></div>
      </div>
      <div className="timebar"><div className={`timebar-fill ${low ? 'low' : ''}`} style={{ width: `${(left / TOTAL) * 100}%` }} /></div>

      <div className={`stroop-word-wrap ${fb || ''}`}>
        <div className="stroop-word" style={{ color: round.ink.hex }}>{round.word.label}</div>
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
