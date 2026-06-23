import { useEffect, useRef, useState } from 'react'
import { ri, shuffle } from '../lib/rng.js'

// Single digits flash one at a time — add them up, then pick the total.
const ROUNDS = 5

export default function NumberFlash({ rng, onFinish }) {
  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState('flash') // flash | answer
  const [digit, setDigit] = useState(null)
  const [count, setCount] = useState(0)
  const [opts, setOpts] = useState([])
  const [fb, setFb] = useState(null)
  const sumRef = useRef(0)
  const correctRef = useRef(0)

  useEffect(() => {
    const n = round + 2 // 3 → 7 digits
    const digits = Array.from({ length: n }, () => ri(rng, 1, 9))
    const sum = digits.reduce((a, b) => a + b, 0)
    sumRef.current = sum
    setPhase('flash')
    setCount(0)
    setFb(null)
    let i = 0
    let alive = true
    const showNext = () => {
      if (!alive) return
      if (i >= digits.length) {
        setDigit(null)
        const set = new Set([sum])
        while (set.size < 4) {
          const d = sum + ri(rng, -6, 6)
          if (d > 0 && d !== sum) set.add(d)
        }
        setOpts(shuffle(rng, [...set]))
        setPhase('answer')
        return
      }
      setDigit(digits[i])
      setCount(i + 1)
      i++
      setTimeout(() => {
        if (!alive) return
        setDigit(null)
        setTimeout(showNext, 140)
      }, 620)
    }
    const t = setTimeout(showNext, 500)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [round])

  function answer(v) {
    if (fb) return
    const ok = v === sumRef.current
    if (ok) correctRef.current += 1
    setFb({ v, ok })
    setTimeout(() => {
      if (round >= ROUNDS) {
        onFinish({ score: correctRef.current, summary: `${correctRef.current}/${ROUNDS} correct` })
      } else {
        setRound((r) => r + 1)
      }
    }, 750)
  }

  return (
    <div className="gf">
      <div className="gf-hud">
        <div className="hud-chip">
          <span className="hud-k">ROUND</span>
          <b className="grad">
            {round}/{ROUNDS}
          </b>
        </div>
        <div className="hud-chip right">
          <b>{phase === 'flash' ? count : '∑'}</b>
          <span className="hud-k">{phase === 'flash' ? 'watch' : 'add them up'}</span>
        </div>
      </div>

      {phase === 'answer' ? (
        <>
          <div className="nf-ask">What's the total?</div>
          <div className="opt-grid">
            {opts.map((v) => (
              <button
                key={v}
                className={`opt-btn num ${fb && fb.v === v ? (fb.ok ? 'good' : 'bad') : ''}`}
                onClick={() => answer(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="nf-stage">
          <div className="nf-flash" key={count}>
            {digit ?? ''}
          </div>
          <div className="nf-sub">remember &amp; add</div>
        </div>
      )}
    </div>
  )
}
