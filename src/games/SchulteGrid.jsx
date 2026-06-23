import { useMemo, useRef, useState, useEffect } from 'react'
import { shuffle } from '../lib/rng.js'

// Tap 1→25 in a shuffled 5×5 grid. Focus & peripheral-vision trainer.
export default function SchulteGrid({ rng, onFinish }) {
  const grid = useMemo(() => shuffle(rng, Array.from({ length: 25 }, (_, i) => i + 1)), [rng])
  const [next, setNext] = useState(1)
  const [misses, setMisses] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [flash, setFlash] = useState(null)
  const [shake, setShake] = useState(false)
  const startRef = useRef(0)
  const intRef = useRef(null)
  const nextRef = useRef(1)
  const missRef = useRef(0)

  useEffect(() => () => clearInterval(intRef.current), [])
  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 200)
    return () => clearTimeout(t)
  }, [flash])

  function tap(v) {
    const cur = nextRef.current
    if (v === cur) {
      if (cur === 1) {
        startRef.current = performance.now()
        intRef.current = setInterval(() => setElapsed(performance.now() - startRef.current), 50)
      }
      setFlash({ v, t: 'good', k: Math.random() })
      if (cur === 25) {
        clearInterval(intRef.current)
        const netSec = (performance.now() - startRef.current) / 1000 + missRef.current
        onFinish({
          // cap protects the board from sub-human (bot/cheat) completion times
          score: Math.max(100, Math.min(8000, Math.round(60000 / netSec))),
          summary: `${netSec.toFixed(1)}s · ${missRef.current} miss`,
        })
        return
      }
      nextRef.current = cur + 1
      setNext(cur + 1)
    } else {
      missRef.current += 1
      setMisses(missRef.current)
      setFlash({ v, t: 'bad', k: Math.random() })
      setShake(true)
      setTimeout(() => setShake(false), 300)
    }
  }

  return (
    <div className="gf">
      <div className="gf-hud">
        <div className="hud-chip">
          <span className="hud-k">NEXT</span>
          <b className="grad">{next}</b>
        </div>
        <div className="hud-chip right">
          <b>{(elapsed / 1000).toFixed(1)}s</b>
          <span className={`hud-k ${misses ? 'warn' : ''}`}>
            {misses ? `${misses} miss (+${misses}s)` : 'no misses'}
          </span>
        </div>
      </div>
      <div className="progress sm">
        <div className="progress-fill" style={{ width: `${((next - 1) / 25) * 100}%` }} />
      </div>
      <div className={`schulte ${shake ? 'shake' : ''}`}>
        {grid.map((v) => (
          <button
            key={v}
            className={`scell ${v < next ? 'done' : ''} ${flash && flash.v === v ? flash.t : ''}`}
            onClick={() => tap(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
