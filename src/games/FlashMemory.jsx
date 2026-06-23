import { useEffect, useRef, useState } from 'react'
import { ri } from '../lib/rng.js'

// A sequence of tiles flashes; repeat it back. Each round adds one. Working memory.
export default function FlashMemory({ rng, onFinish }) {
  const N = 9 // 3×3
  const [seq, setSeq] = useState([])
  const [lit, setLit] = useState(-1)
  const [phase, setPhase] = useState('show') // show | input | over
  const [inputIdx, setInputIdx] = useState(0)
  const [round, setRound] = useState(1)
  const [wrong, setWrong] = useState(-1)
  const seqRef = useRef([])

  // build/extend the sequence at the start of each round
  useEffect(() => {
    const next = [...seqRef.current, ri(rng, 0, N - 1)]
    seqRef.current = next
    setSeq(next)
    setPhase('show')
    setInputIdx(0)
    let i = 0
    const id = setInterval(() => {
      setLit(next[i])
      setTimeout(() => setLit(-1), 320)
      i++
      if (i >= next.length) {
        clearInterval(id)
        setTimeout(() => setPhase('input'), 360)
      }
    }, 560)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  function tap(i) {
    if (phase !== 'input') return
    if (i === seq[inputIdx]) {
      setLit(i)
      setTimeout(() => setLit(-1), 140)
      const ni = inputIdx + 1
      if (ni === seq.length) {
        setTimeout(() => setRound((r) => r + 1), 320) // next round, longer
      } else {
        setInputIdx(ni)
      }
    } else {
      setWrong(i)
      setPhase('over')
      const reached = round // completed rounds = round-1
      setTimeout(
        () =>
          onFinish({
            score: round - 1,
            summary: `reached level ${round} · ${seq.length} tiles`,
          }),
        700,
      )
    }
  }

  return (
    <div className="gf">
      <div className="gf-hud">
        <div className="hud-chip">
          <span className="hud-k">LEVEL</span>
          <b className="grad">{round}</b>
        </div>
        <div className="hud-chip right">
          <b>{seq.length}</b>
          <span className="hud-k">tiles</span>
        </div>
      </div>

      <div className="flash-status">
        {phase === 'show' ? 'watch…' : phase === 'input' ? 'repeat it' : 'missed!'}
      </div>

      <div className="memgrid">
        {Array.from({ length: N }, (_, i) => (
          <button
            key={i}
            className={`memcell ${lit === i ? 'lit' : ''} ${wrong === i ? 'wrong' : ''}`}
            onClick={() => tap(i)}
          />
        ))}
      </div>
    </div>
  )
}
