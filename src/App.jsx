import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getDailyGrid,
  getRandomGrid,
  todayKey,
  SIZE,
  CELLS,
  MISS_PENALTY_MS,
} from './daily.js'
import {
  getHandle,
  getTodayResult,
  submitDaily,
  getPracticeBest,
  recordPractice,
  getDailyBoard,
  getAllTimeBoard,
} from './leaderboard.js'

const PI_LENS_URL = 'https://play.google.com/store/apps/details?id=live.pw.pilens'

const prettyDate = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

// 12.3s, or 1:04.8 once past a minute
function fmt(ms) {
  if (ms == null) return '—'
  const s = ms / 1000
  if (s < 60) return s.toFixed(1) + 's'
  const m = Math.floor(s / 60)
  const rest = (s % 60).toFixed(1).padStart(4, '0')
  return `${m}:${rest}`
}

export default function App() {
  const [view, setView] = useState('home') // home | play | result | board
  const [mode, setMode] = useState('daily') // daily | practice
  const [result, setResult] = useState(null)
  const [round, setRound] = useState(0) // bumps per new game → fresh <Game/> mount

  function play(m) {
    setMode(m)
    setResult(null)
    setRound((r) => r + 1)
    setView('play')
  }

  function onDone(r) {
    if (mode === 'daily') {
      const entry = submitDaily(r)
      setResult({ ...r, name: entry.name })
    } else {
      const improved = recordPractice(r.netMs)
      setResult({ ...r, improved, best: getPracticeBest() })
    }
    setView('result')
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">π</span>
          <div>
            <div className="brand-name">Brain Games</div>
            <a
              className="brand-sub link"
              href={PI_LENS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              by Pi Lens ↗
            </a>
          </div>
        </div>
        <button className="ghost-btn" onClick={() => setView('board')}>
          🏆 Ranks
        </button>
      </header>

      <main className="stage">
        {view === 'home' && <Home onPlay={play} onBoard={() => setView('board')} />}
        {view === 'play' && (
          <Game key={mode + round} mode={mode} onDone={onDone} />
        )}
        {view === 'result' && (
          <Result
            mode={mode}
            result={result}
            onBoard={() => setView('board')}
            onAgain={() => play(mode)}
            onHome={() => setView('home')}
          />
        )}
        {view === 'board' && <Board onBack={() => setView('home')} />}
      </main>

      <footer className="foot">Tap 1 → 25 in order · train focus daily</footer>
    </div>
  )
}

function Home({ onPlay, onBoard }) {
  const daily = useMemo(() => getTodayResult(), [])
  const best = useMemo(() => getPracticeBest(), [])

  return (
    <div className="card center fade-in">
      <div className="date-pill">{prettyDate()}</div>
      <h1 className="hero">
        Tap <span className="grad">1 → 25</span>
        <br />
        as fast as you can.
      </h1>
      <p className="lede">
        The grid the pros use to train <b>focus &amp; peripheral vision</b>. Eyes
        still, mind sharp. Beat your best.
      </p>

      <div className="home-actions">
        {daily ? (
          <button className="primary-btn big locked" onClick={onBoard}>
            ✅ Daily done — {fmt(daily.netMs)} · see ranks
          </button>
        ) : (
          <button className="primary-btn big" onClick={() => onPlay('daily')}>
            ▶ Today's Daily Grid
          </button>
        )}
        <button className="secondary-btn big" onClick={() => onPlay('practice')}>
          ♾ Practice — endless
        </button>
      </div>

      <div className="rules">
        <span>🏁 Same grid for everyone today</span>
        {best && <span>⭐ Your best: {fmt(best)}</span>}
        <span>⚠ Wrong tap = +1s</span>
      </div>
    </div>
  )
}

function Game({ mode, onDone }) {
  const grid = useMemo(
    () => (mode === 'daily' ? getDailyGrid() : getRandomGrid()),
    [mode],
  )
  const [next, setNext] = useState(1)
  const [misses, setMisses] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [flash, setFlash] = useState(null) // {v, type, k}
  const [shaking, setShaking] = useState(false)
  const [penaltyPop, setPenaltyPop] = useState(0)

  const startRef = useRef(0)
  const intRef = useRef(null)
  const doneRef = useRef(false)
  const missRef = useRef(0)
  // Track the current target in a ref so taps are never lost, even if the
  // player taps faster than React re-renders.
  const nextRef = useRef(1)

  useEffect(() => () => clearInterval(intRef.current), [])

  // clear the per-tile flash shortly after it fires
  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 220)
    return () => clearTimeout(t)
  }, [flash])

  function tap(v) {
    if (doneRef.current) return
    const cur = nextRef.current

    if (v === cur) {
      if (cur === 1) {
        startRef.current = performance.now()
        intRef.current = setInterval(
          () => setElapsedMs(performance.now() - startRef.current),
          50,
        )
      }
      setFlash({ v, type: 'good', k: Math.random() })
      if (cur === CELLS) {
        clearInterval(intRef.current)
        doneRef.current = true
        const elapsed = performance.now() - startRef.current
        onDone({
          netMs: Math.round(elapsed + missRef.current * MISS_PENALTY_MS),
          elapsedMs: Math.round(elapsed),
          misses: missRef.current,
        })
        return
      }
      nextRef.current = cur + 1
      setNext(cur + 1)
    } else {
      missRef.current += 1
      setMisses(missRef.current)
      setFlash({ v, type: 'bad', k: Math.random() })
      setShaking(true)
      setPenaltyPop((p) => p + 1)
      setTimeout(() => setShaking(false), 320)
    }
  }

  const progress = ((next - 1) / CELLS) * 100

  return (
    <div className="card play fade-in">
      <div className="play-head">
        <div className="next-badge">
          <span className="next-label">NEXT</span>
          <span className="next-num">{next}</span>
        </div>
        <div className="play-stats">
          <div className="timer-big">{fmt(elapsedMs)}</div>
          <div className={`miss-line ${misses ? 'has' : ''}`}>
            {misses ? `${misses} miss · +${misses}s` : 'no misses'}
            {penaltyPop > 0 && (
              <span key={penaltyPop} className="pen-pop">
                +1s
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="progress">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className={`grid ${shaking ? 'shake' : ''}`}>
        {grid.map((v) => {
          const done = v < next
          const fl = flash && flash.v === v ? flash.type : ''
          return (
            <button
              key={v}
              className={`cell ${done ? 'done' : ''} ${fl}`}
              onClick={() => tap(v)}
            >
              {v}
            </button>
          )
        })}
      </div>

      <div className="play-hint">
        {mode === 'daily' ? "Today's ranked grid" : 'Practice · endless'} · keep
        your eyes near the centre
      </div>
    </div>
  )
}

function Result({ mode, result, onBoard, onAgain, onHome }) {
  if (!result) return null
  const isDaily = mode === 'daily'

  return (
    <div className="card center fade-in">
      {!isDaily && result.improved && (
        <div className="date-pill best-pill">🎉 New personal best!</div>
      )}
      {(isDaily || !result.improved) && (
        <div className="date-pill">{isDaily ? "Daily result" : 'Run complete'}</div>
      )}

      <div className="big-score">{fmt(result.netMs)}</div>
      <div className="score-cap">net time {result.misses ? '(incl. penalties)' : ''}</div>

      <div className="stat-row">
        <div className="stat">
          <div className="stat-num">{fmt(result.elapsedMs)}</div>
          <div className="stat-label">raw time</div>
        </div>
        <div className="stat">
          <div className="stat-num">{result.misses}</div>
          <div className="stat-label">misses</div>
        </div>
        <div className="stat">
          <div className="stat-num">
            {isDaily ? result.name.split(' ')[0] : fmt(result.best)}
          </div>
          <div className="stat-label">{isDaily ? 'you are' : 'your best'}</div>
        </div>
      </div>

      {isDaily ? (
        <>
          <p className="muted">
            You're on the board as <b>{result.name}</b>
          </p>
          <button className="primary-btn big" onClick={onBoard}>
            See the daily ranks →
          </button>
          <button className="text-btn" disabled>
            Daily is one attempt · come back tomorrow
          </button>
        </>
      ) : (
        <>
          <button className="primary-btn big" onClick={onAgain}>
            ↻ Go again
          </button>
          <button className="secondary-btn big" onClick={onBoard}>
            🏆 Daily ranks
          </button>
          <button className="text-btn" onClick={onHome}>
            Home
          </button>
        </>
      )}
    </div>
  )
}

function Board({ onBack }) {
  const [tab, setTab] = useState('daily')
  const daily = useMemo(() => getDailyBoard(), [])
  const allTime = useMemo(() => getAllTimeBoard(), [])
  const rows = tab === 'daily' ? daily : allTime
  const me = getHandle()

  return (
    <div className="card fade-in">
      <div className="board-head">
        <h2>Fastest focus</h2>
        <button className="ghost-btn" onClick={onBack}>
          ← Back
        </button>
      </div>

      <div className="tabs">
        <button
          className={tab === 'daily' ? 'tab active' : 'tab'}
          onClick={() => setTab('daily')}
        >
          Today
        </button>
        <button
          className={tab === 'all' ? 'tab active' : 'tab'}
          onClick={() => setTab('all')}
        >
          Hall of Fame
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="empty">No times yet. Be the first!</p>
      ) : (
        <ol className="board-list">
          {rows.map((r, i) => (
            <li
              key={r.ts}
              className={`board-row rank-${i + 1} ${r.name === me ? 'me' : ''}`}
            >
              <span className="rank">{medal(i)}</span>
              <span className="lb-name">
                {r.name}
                {r.name === me && <span className="you-tag">you</span>}
              </span>
              <span className="lb-meta">
                {r.misses ? `${r.misses}✗` : '✓'}
              </span>
              <span className="lb-score">{fmt(r.netMs)}</span>
            </li>
          ))}
        </ol>
      )}

      <p className="muted small">
        Ranked by net time. Scores are saved on this device — hook up a backend
        for a shared board.
      </p>
    </div>
  )
}

function medal(i) {
  return ['🥇', '🥈', '🥉'][i] || i + 1
}
