import { useEffect, useMemo, useRef, useState } from 'react'
import { shuffle } from '../lib/rng.js'

// Draw one continuous path through every cell, passing the numbered dots
// 1 → K in order. Drag to draw, drag back / Undo to backtrack.
// Original implementation (own generator + ribbon rendering + input).
const R = 6
const C = 6
const TOTAL = R * C
const K = 8

function genPath(rng) {
  const idx = (r, c) => r * C + c
  const inb = (r, c) => r >= 0 && r < R && c >= 0 && c < C
  for (let attempt = 0; attempt < 80; attempt++) {
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
          if (steps++ > 120000) return false
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
  const path = []
  for (let r = 0; r < R; r++) {
    const cs = [...Array(C).keys()]
    if (r % 2) cs.reverse()
    for (const c of cs) path.push([r, c])
  }
  return path
}

export default function Zip({ rng, onFinish }) {
  const { checkpoints, startIdx, solution } = useMemo(() => {
    const p = genPath(rng)
    const cps = {}
    const step = (p.length - 1) / (K - 1)
    for (let n = 0; n < K; n++) {
      const [r, c] = p[Math.round(n * step)]
      cps[r * C + c] = n + 1
    }
    const sol = p.map(([r, c]) => r * C + c)
    return { checkpoints: cps, startIdx: sol[0], solution: sol }
  }, [rng])

  const [path, setPath] = useState([startIdx])
  const [nextCp, setNextCp] = useState(2)
  const [bad, setBad] = useState(-1)
  const [hint, setHint] = useState(-1)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(performance.now())
  const dragging = useRef(false)
  const gridRef = useRef(null)
  const doneRef = useRef(false)

  useEffect(() => {
    const t = setInterval(() => {
      if (!doneRef.current) setElapsed(performance.now() - startRef.current)
    }, 250)
    return () => clearInterval(t)
  }, [])

  const head = path[path.length - 1]
  const inPath = new Set(path)
  const adj = (a, b) => {
    const ar = (a / C) | 0, ac = a % C, br = (b / C) | 0, bc = b % C
    return Math.abs(ar - br) + Math.abs(ac - bc) === 1
  }

  function step(cell) {
    if (cell == null || Number.isNaN(cell)) return
    const prev = path[path.length - 2]
    if (cell === prev) {
      const removed = path[path.length - 1]
      if (checkpoints[removed] === nextCp - 1) setNextCp((n) => n - 1)
      setPath((p) => p.slice(0, -1))
      return
    }
    if (cell === head || inPath.has(cell) || !adj(cell, head)) return
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
    setHint(-1)
    if (nc > K) {
      // all dots 1→K connected in order with one continuous line → solved
      doneRef.current = true
      const sec = (performance.now() - startRef.current) / 1000
      setTimeout(
        () =>
          onFinish({
            score: Math.max(10, Math.min(99, Math.round(120 - sec))),
            summary: `solved in ${sec.toFixed(0)}s`,
          }),
        280,
      )
    }
  }

  function cellFromEvent(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const c = el && el.closest('[data-i]')
    return c ? Number(c.dataset.i) : null
  }
  function onDown(e) {
    dragging.current = true
    gridRef.current?.setPointerCapture?.(e.pointerId)
    step(cellFromEvent(e))
  }
  function onMove(e) {
    if (dragging.current) step(cellFromEvent(e))
  }
  function onUp() {
    dragging.current = false
  }

  function undo() {
    if (path.length <= 1) return
    const removed = path[path.length - 1]
    if (checkpoints[removed] === nextCp - 1) setNextCp((n) => n - 1)
    setPath((p) => p.slice(0, -1))
  }
  function showHint() {
    // if the drawn path follows the known solution, suggest the next cell
    let prefix = true
    for (let i = 0; i < path.length; i++) if (path[i] !== solution[i]) prefix = false
    const cell = prefix && path.length < TOTAL ? solution[path.length] : -1
    setHint(cell)
    setTimeout(() => setHint(-1), 900)
  }

  // ribbon polyline points in a 0..C / 0..R coordinate space
  const pts = path.map((i) => `${(i % C) + 0.5},${((i / C) | 0) + 0.5}`).join(' ')

  return (
    <div className="gf">
      <div className="gf-hud">
        <div className="hud-chip">
          <span className="hud-k">DOTS</span>
          <b className="grad">
            {Math.min(nextCp - 1, K)}/{K}
          </b>
        </div>
        <div className="hud-chip right">
          <b className="hud-time">{(elapsed / 1000).toFixed(0)}s</b>
          <span className="hud-k">{nextCp > K ? 'done!' : `next dot ${nextCp}`}</span>
        </div>
      </div>

      <div className="zip-hint-line">Connect the dots 1→{K} in order · one continuous line · faster = higher score</div>

      <div
        className="zipgrid"
        ref={gridRef}
        style={{ gridTemplateColumns: `repeat(${C}, 1fr)` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {Array.from({ length: TOTAL }, (_, i) => (
          <div
            key={i}
            data-i={i}
            className={`zipcell ${inPath.has(i) ? 'on' : ''} ${i === head ? 'head' : ''} ${bad === i ? 'bad' : ''} ${hint === i ? 'hint' : ''}`}
          />
        ))}

        <svg className="zip-ribbon" viewBox={`0 0 ${C} ${R}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="zip-grad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="var(--g1, #2ee6a6)" />
              <stop offset="1" stopColor="var(--g2, #00d4ff)" />
            </linearGradient>
          </defs>
          {path.length > 1 && (
            <polyline
              points={pts}
              fill="none"
              stroke="url(#zip-grad)"
              strokeWidth="0.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
        </svg>

        <div className="zip-nums" style={{ gridTemplateColumns: `repeat(${C}, 1fr)` }}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <div key={i} className="zip-numcell">
              {checkpoints[i] && <span className="zip-dot">{checkpoints[i]}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="zip-controls">
        <button className="secondary-btn" onClick={undo} disabled={path.length <= 1}>
          ↺ Undo
        </button>
        <button className="secondary-btn" onClick={showHint}>
          💡 Hint
        </button>
      </div>
    </div>
  )
}
