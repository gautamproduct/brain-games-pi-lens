import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getDailyPuzzles,
  todayKey,
  POINTS,
  MAX_SCORE,
  PUZZLE_COUNT,
} from './daily.js'
import {
  getHandle,
  getTodayResult,
  submitScore,
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

function scoreForQuestion(elapsedSec, correct) {
  if (!correct) return 0
  const { base, speedMax, speedWindow, perQuestionTimeout } = POINTS
  if (elapsedSec >= perQuestionTimeout) return base
  const speedFrac = Math.max(
    0,
    (perQuestionTimeout - Math.max(elapsedSec, speedWindow)) /
      (perQuestionTimeout - speedWindow),
  )
  return base + Math.round(speedMax * speedFrac)
}

export default function App() {
  const [view, setView] = useState('home') // home | play | result | board
  const alreadyPlayed = useMemo(() => getTodayResult(), [])

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
          🏆 Leaderboard
        </button>
      </header>

      <main className="stage">
        {view === 'home' && (
          <Home
            alreadyPlayed={alreadyPlayed}
            onPlay={() => setView('play')}
            onBoard={() => setView('board')}
          />
        )}
        {view === 'play' && (
          <Game onDone={() => setView('result')} />
        )}
        {view === 'result' && (
          <Result
            result={getTodayResult()}
            onBoard={() => setView('board')}
          />
        )}
        {view === 'board' && <Board onBack={() => setView('home')} />}
      </main>

      <footer className="foot">One challenge a day · same 7 for everyone</footer>
    </div>
  )
}

function Home({ alreadyPlayed, onPlay, onBoard }) {
  return (
    <div className="card center fade-in">
      <div className="date-pill">{prettyDate()}</div>
      <h1 className="hero">7 problems.<br />Beat the clock.</h1>
      <p className="lede">
        Same set for every player today. Score on accuracy <b>and</b> speed.
        One attempt — make it count.
      </p>

      {alreadyPlayed ? (
        <>
          <div className="done-banner">
            ✅ You played today — scored <b>{alreadyPlayed.score}</b>
          </div>
          <button className="primary-btn" onClick={onBoard}>
            See where you rank →
          </button>
          <p className="muted">Come back tomorrow for a new set.</p>
        </>
      ) : (
        <>
          <button className="primary-btn big" onClick={onPlay}>
            Start today's challenge
          </button>
          <div className="rules">
            <span>⚡ +50 speed bonus / question</span>
            <span>⏱ 15s per question</span>
            <span>🎯 {MAX_SCORE} pts max</span>
          </div>
        </>
      )}
    </div>
  )
}

function Game({ onDone }) {
  const puzzles = useMemo(() => getDailyPuzzles(), [])
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [feedback, setFeedback] = useState(null) // {ok, gained, answer}
  const [secs, setSecs] = useState(POINTS.perQuestionTimeout)

  const startRef = useRef(Date.now())
  const totalStartRef = useRef(Date.now())
  const inputRef = useRef(null)
  const lockRef = useRef(false)

  const current = puzzles[idx]

  // Per-question countdown.
  useEffect(() => {
    startRef.current = Date.now()
    setSecs(POINTS.perQuestionTimeout)
    lockRef.current = false
    setFeedback(null)
    setInput('')
    inputRef.current?.focus()

    const t = setInterval(() => {
      const left =
        POINTS.perQuestionTimeout -
        Math.floor((Date.now() - startRef.current) / 1000)
      setSecs(left)
      if (left <= 0) {
        clearInterval(t)
        resolve(null) // timed out
      }
    }, 200)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  function resolve(value) {
    if (lockRef.current) return
    lockRef.current = true

    const elapsed = (Date.now() - startRef.current) / 1000
    const ok = value !== null && Number(value) === current.answer
    const gained = scoreForQuestion(elapsed, ok)

    const newScore = score + gained
    const newCorrect = correctCount + (ok ? 1 : 0)
    setScore(newScore)
    setCorrectCount(newCorrect)
    setFeedback({ ok, gained, answer: current.answer })

    setTimeout(() => {
      if (idx + 1 >= PUZZLE_COUNT) {
        const timeMs = Date.now() - totalStartRef.current
        submitScore({
          score: newScore,
          correct: newCorrect,
          timeMs,
        })
        onDone()
      } else {
        setIdx((i) => i + 1)
      }
    }, 850)
  }

  function onSubmit(e) {
    e.preventDefault()
    if (input.trim() === '' || lockRef.current) return
    resolve(input.trim())
  }

  const pct = (idx / PUZZLE_COUNT) * 100
  const timePct = Math.max(0, (secs / POINTS.perQuestionTimeout) * 100)
  const low = secs <= 5

  return (
    <div className="card play fade-in">
      <div className="play-head">
        <div className="qcount">
          Q{idx + 1}
          <span>/{PUZZLE_COUNT}</span>
        </div>
        <div className="live-score">{score} pts</div>
      </div>

      <div className="progress">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="timer-wrap">
        <div
          className={`timer-bar ${low ? 'low' : ''}`}
          style={{ width: `${timePct}%` }}
        />
      </div>
      <div className={`timer-num ${low ? 'low' : ''}`}>{Math.max(secs, 0)}s</div>

      <div className="problem">{current.text}</div>

      <form onSubmit={onSubmit} className="answer-form">
        <input
          ref={inputRef}
          className={`answer ${
            feedback ? (feedback.ok ? 'ok' : 'bad') : ''
          }`}
          type="number"
          inputMode="numeric"
          placeholder="?"
          value={input}
          disabled={!!feedback}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        <button className="primary-btn" type="submit" disabled={!!feedback}>
          Enter
        </button>
      </form>

      <div className="feedback-slot">
        {feedback &&
          (feedback.ok ? (
            <span className="fb ok">✓ +{feedback.gained}</span>
          ) : (
            <span className="fb bad">✗ answer was {feedback.answer}</span>
          ))}
      </div>
    </div>
  )
}

function Result({ result, onBoard }) {
  if (!result) return null
  const accuracy = Math.round((result.correct / PUZZLE_COUNT) * 100)
  const secs = (result.timeMs / 1000).toFixed(1)

  return (
    <div className="card center fade-in">
      <div className="date-pill">Today's result</div>
      <div className="big-score">{result.score}</div>
      <div className="score-cap">out of {MAX_SCORE}</div>

      <div className="stat-row">
        <div className="stat">
          <div className="stat-num">
            {result.correct}/{PUZZLE_COUNT}
          </div>
          <div className="stat-label">correct</div>
        </div>
        <div className="stat">
          <div className="stat-num">{accuracy}%</div>
          <div className="stat-label">accuracy</div>
        </div>
        <div className="stat">
          <div className="stat-num">{secs}s</div>
          <div className="stat-label">total time</div>
        </div>
      </div>

      <p className="muted">You're on the board as <b>{result.name}</b></p>

      <button className="primary-btn big" onClick={onBoard}>
        See the daily leaderboard →
      </button>
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
        <h2>Leaderboard</h2>
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
        <p className="empty">No scores yet. Be the first!</p>
      ) : (
        <ol className="board-list">
          {rows.map((r, i) => (
            <li
              key={r.ts}
              className={`board-row rank-${i + 1} ${
                r.name === me ? 'me' : ''
              }`}
            >
              <span className="rank">{medal(i)}</span>
              <span className="lb-name">
                {r.name}
                {r.name === me && <span className="you-tag">you</span>}
              </span>
              <span className="lb-meta">{(r.timeMs / 1000).toFixed(1)}s</span>
              <span className="lb-score">{r.score}</span>
            </li>
          ))}
        </ol>
      )}

      <p className="muted small">
        Scores are saved on this device. Hook up a backend for a shared board.
      </p>
    </div>
  )
}

function medal(i) {
  return ['🥇', '🥈', '🥉'][i] || i + 1
}
