import { useMemo, useRef, useState } from 'react'
import { shuffle } from '../lib/rng.js'

// Draw one continuous path through every cell, hitting the numbered dots
// 1 → K in order. Original implementation (own generator + tap input).
const R = 5
const C = 5
const TOTAL = R * C
const K = 5

function genPath(rng) {
  const idx = (r, c) => r * C + c
  const inb = (r, c) => r >= 0 && r < R && c >= 0 && c < C
  for (let attempt = 0; attempt < 60; attempt++) {
    const sr = Math.floor(rng() * R)
    const sc = Math.floor(rng() * C)
    const visited = new Array(TOTAL).fill(false)
    visited[idx(sr, sc)] = true
    const path = [[sr, sc]]
    let steps = 0
    const dfs = (r, c) => {
      if (path.length === TOTAL) return true
      for (const [dr, dc] of shuffle(rng, [[0, 1], [0, -1], [1, 0], [-1, 0]])) {
        const nr = r + dr
        const nc = c + dc
        if (inb(nr, nc) && !visited[idx(nr, nc)]) {
          if (steps++ > 40000) return false
          visited[idx(nr, nc)] = true
          path.push([nr, nc])
          if (dfs(nr, nc)) return true
          visited[idx(nr, nc)] = false
          path.pop()
        }
      }
      return false
    }
    if (dfs(sr, sc)) return path
  }
  // snake fallback (always valid)
  const path = []
  for (let r = 0; r < R; r++) {
    const cs = [...Array(C).keys()]
    if (r % 2) cs.reverse()
    for (const c of cs) path.push([r, c])
  }
  return path
}

export default function Zip({ rng, onFinish }) {
  const { checkpoints, startIdx } = useMemo(() => {
    const path = genPath(rng)
    const cps = {}
    const positions = [0, 6, 12, 18, 24]
    positions.forEach((pos, n) => {
      const [r, c] = path[pos]
      cps[r * C + c] = n + 1
    })
    const [sr, sc] = path[0]
    return { checkpoints: cps, startIdx: sr * C + sc }
  }, [rng])

  const [path, setPath] = useState([startIdx])
  const [nextCp, setNextCp] = useState(2) // dot 1 is the start
  const [bad, setBad] = useState(-1)
  const startRef = useRef(performance.now())

  const head = path[path.length - 1]
  const inPath = new Set(path)
  const adj = (a, b) => {
    const ar = Math.floor(a / C), ac = a % C, br = Math.floor(b / C), bc = b % C
    return Math.abs(ar - br) + Math.abs(ac - bc) === 1
  }

  function tap(cell) {
    if (cell === head && path.length > 1) {
      const removed = head
      setPath(path.slice(0, -1))
      if (checkpoints[removed] && checkpoints[removed] === nextCp - 1) setNextCp(nextCp - 1)
      return
    }
    if (inPath.has(cell) || !adj(cell, head)) return
    const cp = checkpoints[cell]
    if (cp && cp !== nextCp) {
      setBad(cell)
      setTimeout(() => setBad(-1), 320)
      return
    }
    const np = [...path, cell]
    const nc = cp === nextCp ? nextCp + 1 : nextCp
    setPath(np)
    setNextCp(nc)
    if (np.length === TOTAL && nc > K) {
      const sec = (performance.now() - startRef.current) / 1000
      setTimeout(
        () => onFinish({ score: Math.max(10, Math.min(99, Math.round(120 - sec))), summary: `solved in ${sec.toFixed(0)}s` }),
        260,
      )
    }
  }

  function reset() {
    setPath([startIdx])
    setNextCp(2)
  }

  return (
    <div className="gf">
      <div className="gf-hud">
        <div className="hud-chip">
          <span className="hud-k">FILLED</span>
          <b className="grad">
            {path.length}/{TOTAL}
          </b>
        </div>
        <div className="hud-chip right">
          <b>{nextCp > K ? '✓' : nextCp}</b>
          <span className="hud-k">{nextCp > K ? 'all dots' : 'next dot'}</span>
        </div>
      </div>

      <div className="zip-hint">Fill every cell in one path · hit 1→{K} in order</div>

      <div className="zipgrid">
        {Array.from({ length: TOTAL }, (_, i) => {
          const filled = inPath.has(i)
          const cp = checkpoints[i]
          return (
            <button
              key={i}
              className={`zipcell ${filled ? 'on' : ''} ${i === head ? 'head' : ''} ${bad === i ? 'bad' : ''} ${cp ? 'cp' : ''}`}
              onClick={() => tap(i)}
            >
              {cp ? <span className="zip-num">{cp}</span> : filled ? <span className="zip-dot" /> : ''}
            </button>
          )
        })}
      </div>

      <button className="secondary-btn big" onClick={reset}>
        ↺ Reset path
      </button>
    </div>
  )
}
