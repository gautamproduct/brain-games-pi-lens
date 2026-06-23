import { useMemo, useRef, useState } from 'react'
import { ri } from '../lib/rng.js'
import { useCountdown } from '../lib/useCountdown.js'

// One tile is a slightly different shade. Tap it. The difference shrinks each round.
export default function OddOneOut({ rng, onFinish }) {
  const [round, setRound] = useState(1)
  const [penaltyMs, setPenaltyMs] = useState(0)
  const [bump, setBump] = useState(false)
  const roundRef = useRef(1)
  const rngRef = useRef(rng)

  const left = useCountdown(45000, true, () =>
    onFinish({ score: (roundRef.current - 1) * 100, summary: `${roundRef.current - 1} rounds` }),
  )

  // grid size and colour for this round
  const board = useMemo(() => {
    const r = roundRef.current
    const cols = Math.min(2 + Math.floor(r / 2), 6)
    const n = cols * cols
    const hue = ri(rngRef.current, 0, 359)
    const sat = 55 + ri(rngRef.current, 0, 20)
    const lum = 45 + ri(rngRef.current, 0, 15)
    const delta = Math.max(4, 26 - r * 1.6) // shrinking difference
    const odd = ri(rngRef.current, 0, n - 1)
    const base = `hsl(${hue} ${sat}% ${lum}%)`
    const diff = `hsl(${hue} ${sat}% ${lum + delta}%)`
    return { cols, n, odd, base, diff }
  }, [round])

  function tap(i) {
    if (i === board.odd) {
      roundRef.current += 1
      setRound((r) => r + 1)
    } else {
      setPenaltyMs((p) => p + 2000)
      setBump(true)
      setTimeout(() => setBump(false), 240)
    }
  }

  const shown = Math.max(0, left - penaltyMs)

  return (
    <div className="gf">
      <div className="gf-hud">
        <div className="hud-chip">
          <span className="hud-k">ROUND</span>
          <b className="grad">{round}</b>
        </div>
        <div className="hud-chip right">
          <b>{(shown / 1000).toFixed(0)}s</b>
          <span className="hud-k">wrong = −2s</span>
        </div>
      </div>

      <div className="odd-hint">spot the different tile</div>

      <div
        className={`oddgrid ${bump ? 'shake' : ''}`}
        style={{ gridTemplateColumns: `repeat(${board.cols}, 1fr)` }}
      >
        {Array.from({ length: board.n }, (_, i) => (
          <button
            key={i}
            className="oddcell"
            style={{ background: i === board.odd ? board.diff : board.base }}
            onClick={() => tap(i)}
          />
        ))}
      </div>
    </div>
  )
}
