import { useEffect, useRef, useState } from 'react'
import { shuffle } from '../lib/rng.js'
import { useCountdown } from '../lib/useCountdown.js'

// Memory Matrix: several tiles light up AT ONCE for a moment, then hide.
// Tap exactly those tiles before the clock runs out. Miss one → run ends.
const SIZE = 4
const N = SIZE * SIZE

export default function FlashMemory({ rng, onFinish }) {
  const [level, setLevel] = useState(1)
  const [phase, setPhase] = useState('show') // show | pick | over
  const [lit, setLit] = useState([])
  const [found, setFound] = useState([])
  const [wrong, setWrong] = useState(-1)
  const litSet = useRef(new Set())
  const doneRef = useRef(false)

  function end() {
    if (doneRef.current) return
    doneRef.current = true
    setPhase('over')
    setTimeout(() => onFinish({ score: level - 1, summary: `reached level ${level}` }), 700)
  }

  // time to tap them: more tiles → a little more time
  const pickMs = 2200 + lit.length * 900
  const left = useCountdown(pickMs, phase === 'pick', end)
  const low = left <= 2000

  useEffect(() => {
    const count = Math.min(level + 2, N - 3) // 3,4,5… lit tiles
    const idxs = shuffle(rng, [...Array(N).keys()]).slice(0, count)
    litSet.current = new Set(idxs)
    setLit(idxs)
    setFound([])
    setWrong(-1)
    setPhase('show')
    const t = setTimeout(() => setPhase('pick'), 900 + count * 280)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  function tap(i) {
    if (phase !== 'pick') return
    if (litSet.current.has(i)) {
      if (found.includes(i)) return
      const nf = [...found, i]
      setFound(nf)
      if (nf.length === litSet.current.size) {
        setPhase('show')
        setTimeout(() => setLevel((l) => l + 1), 380)
      }
    } else {
      setWrong(i)
      end()
    }
  }

  const showing = phase === 'show'

  return (
    <div className={`gf ${low && phase === 'pick' ? 'time-low' : ''}`}>
      <div className="gf-hud">
        <div className="hud-chip">
          <span className="hud-k">LEVEL</span>
          <b className="grad">{level}</b>
        </div>
        <div className="hud-chip right">
          <b>
            {found.length}/{litSet.current.size || lit.length}
          </b>
          <span className="hud-k">{showing ? 'memorise' : 'tap the tiles'}</span>
        </div>
      </div>

      <div className="mm-status">
        {showing ? '👀 remember the lit tiles' : phase === 'over' ? 'missed!' : 'now tap them'}
      </div>
      {phase === 'pick' && (
        <div className="timebar"><div className={`timebar-fill ${low ? 'low' : ''}`} style={{ width: `${(left / pickMs) * 100}%` }} /></div>
      )}

      <div className="memgrid mm">
        {Array.from({ length: N }, (_, i) => {
          const isLit = showing && lit.includes(i)
          const isFound = found.includes(i)
          return (
            <button
              key={i}
              className={`memcell ${isLit ? 'lit' : ''} ${isFound ? 'found' : ''} ${wrong === i ? 'wrong' : ''}`}
              onClick={() => tap(i)}
            />
          )
        })}
      </div>
    </div>
  )
}
