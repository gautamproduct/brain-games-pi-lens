import { useEffect, useRef, useState } from 'react'
import { ri } from '../lib/rng.js'

// 5 trials: wait for green, then tap as fast as you can. Reflex + sustained attention.
const TRIALS = 5

export default function Reaction({ rng, onFinish }) {
  const [trial, setTrial] = useState(0)
  const [state, setState] = useState('wait') // wait | go | early | done
  const [last, setLast] = useState(null)
  const goAtRef = useRef(0)
  const timerRef = useRef(null)
  const timesRef = useRef([])

  function arm() {
    setState('wait')
    setLast(null)
    const delay = 900 + ri(rng, 0, 2200)
    timerRef.current = setTimeout(() => {
      goAtRef.current = performance.now()
      setState('go')
    }, delay)
  }

  useEffect(() => {
    arm()
    return () => clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial])

  function finishAll() {
    const arr = timesRef.current
    const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    onFinish({ score: Math.max(100, Math.round(120000 / avg)), summary: `avg ${avg}ms` })
  }

  function hit() {
    if (state === 'wait') {
      clearTimeout(timerRef.current)
      setState('early')
      return
    }
    if (state === 'go') {
      const rt = Math.round(performance.now() - goAtRef.current)
      timesRef.current.push(rt)
      setLast(rt)
      setState('done')
      if (trial + 1 >= TRIALS) setTimeout(finishAll, 750)
    }
  }

  const cls =
    state === 'go' ? 'go' : state === 'early' ? 'early' : state === 'done' ? 'done' : 'wait'
  const msg =
    state === 'wait'
      ? 'wait for green…'
      : state === 'go'
      ? 'TAP!'
      : state === 'early'
      ? 'too early — tap to retry'
      : `${last} ms`

  return (
    <div className="gf">
      <div className="gf-hud">
        <div className="hud-chip">
          <span className="hud-k">TRIAL</span>
          <b className="grad">
            {Math.min(trial + 1, TRIALS)}/{TRIALS}
          </b>
        </div>
        <div className="hud-chip right">
          <b>{timesRef.current.length ? timesRef.current[timesRef.current.length - 1] + 'ms' : '—'}</b>
          <span className="hud-k">last</span>
        </div>
      </div>

      <button
        className={`react-pad ${cls}`}
        onClick={() => {
          if (state === 'early') arm()
          else if (state === 'done') setTrial((t) => t + 1)
          else hit()
        }}
      >
        {msg}
      </button>
    </div>
  )
}
