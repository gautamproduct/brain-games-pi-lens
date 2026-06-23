import { useEffect, useMemo, useState } from 'react'
import Logo from './Logo.jsx'
import { GAMES, featuredGame } from './games/index.js'
import { dailyRng, todayKey } from './lib/rng.js'
import {
  getProfile,
  hasName,
  setName,
  finishSession,
  recordScore,
  levelProgress,
  myName,
  playedTodayCount,
  getUserId,
  DAILY_LIMIT,
} from './lib/store.js'
import { gameBoard, overallBoard, myDailyRank } from './lib/leaderboard.js'
import { logPlay, supabaseEnabled } from './lib/supabase.js'
import { shareResult } from './lib/share.js'

const PI_LENS_URL = 'https://play.google.com/store/apps/details?id=live.pw.pilens'

export default function App() {
  const [tab, setTab] = useState('home') // home | ranks
  const [session, setSession] = useState(null) // { game, locked }
  const [tick, force] = useState(0)
  const refresh = () => force((n) => n + 1)
  const [rank, setRank] = useState(null)

  // keep the top-right rank badge in sync
  useEffect(() => {
    let alive = true
    myDailyRank().then((r) => alive && setRank(r)).catch(() => {})
    return () => { alive = false }
  }, [tick])

  function launch(game) {
    const locked = playedTodayCount(game.id) >= DAILY_LIMIT
    setSession({ game, locked })
  }

  function closeSession() {
    setSession(null)
    refresh()
  }

  return (
    <div className="app">
      <Header rank={rank} onOpen={() => setTab('ranks')} />

      <main className="stage">
        {tab === 'home' && <Home onPlay={launch} />}
        {tab === 'ranks' && <Ranks onBack={() => setTab('home')} onChanged={refresh} />}
      </main>

      {session && (
        <Session
          game={session.game}
          locked={session.locked}
          onExit={closeSession}
          onRanks={() => {
            setSession(null)
            setTab('ranks')
            refresh()
          }}
        />
      )}
    </div>
  )
}

/* ----------------------------- header ----------------------------- */
function Header({ rank, onOpen }) {
  const p = getProfile()
  const { lvl, pct } = levelProgress(p.xp)
  return (
    <header className="topbar">
      <div className="brand">
        <Logo />
        <div>
          <div className="brand-name">Brain Games</div>
          <a className="brand-sub link" href={PI_LENS_URL} target="_blank" rel="noopener noreferrer">
            By: Pi Lens App ↗
          </a>
        </div>
      </div>
      <button className="streak-chip" onClick={onOpen} title="Leaderboards">
        <span className="flame">🔥</span>
        <b>{p.streak}</b>
        <span className="lvl-mini">{rank ? `#${rank} today` : `Lv ${lvl}`}</span>
        <span className="xpbar"><span style={{ width: `${pct}%` }} /></span>
      </button>
    </header>
  )
}

/* ------------------------------ home ------------------------------ */
function Home({ onPlay }) {
  const featured = featuredGame(todayKey())
  const p = getProfile()
  const plays = Object.fromEntries(GAMES.map((g) => [g.id, playedTodayCount(g.id)]))

  const foot = (g) => {
    const n = plays[g.id]
    if (n >= DAILY_LIMIT) return <span className="gc-done">✓ {p.best[g.id] ?? ''}</span>
    if (n === 1) return <span className="gc-play">1 left ▸</span>
    return <span className="gc-play">Play ▸</span>
  }

  return (
    <div className="home fade-in">
      <DailyHero game={featured} onPlay={onPlay} done={plays[featured.id] >= DAILY_LIMIT} />

      <div className="section-head">
        <h2>Free Games</h2>
        <span className="pill-free">8 unlocked</span>
      </div>

      <div className="game-grid">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className="game-card"
            style={{ '--g1': g.g1, '--g2': g.g2 }}
            onClick={() => onPlay(g)}
          >
            <div className="gc-emoji">{g.emoji}</div>
            <div className="gc-name">{g.name}</div>
            <div className="gc-blurb">{g.blurb}</div>
            <div className="gc-foot">
              <span className="gc-tag">{g.tag}</span>
              {foot(g)}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function DailyHero({ game, onPlay, done }) {
  return (
    <button className="daily-hero" style={{ '--g1': game.g1, '--g2': game.g2 }} onClick={() => onPlay(game)}>
      <div className="dh-top">
        <span className="dh-label">★ DAILY CHALLENGE</span>
        <span className="dh-date">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
      </div>
      <div className="dh-main">
        <span className="dh-emoji">{game.emoji}</span>
        <div>
          <div className="dh-name">{game.name}</div>
          <div className="dh-sub">New puzzle today · {game.blurb}</div>
        </div>
      </div>
      <div className="dh-cta">{done ? 'Done ✓ · see ranks' : 'Start ▸'}</div>
    </button>
  )
}

/* ---------------------------- session ----------------------------- */
function Session({ game, locked, onExit, onRanks }) {
  const [result, setResult] = useState(null)
  const [started, setStarted] = useState(false)
  const [needName, setNeedName] = useState(false)
  const rng = useMemo(() => dailyRng(game.id), [game.id])

  function handleFinish({ score, summary }) {
    const xpGain = Math.round(score) // XP = points earned; stays 1–2 digit
    finishSession(game.id, score, xpGain)
    recordScore(game.id, score, summary)
    logPlay({ userId: getUserId(), name: myName(), gameId: game.id, score })
    setResult({ score, summary, xpGain })
  }

  // rules first → Start → ask name (only if not set) → play
  function onStart() {
    if (hasName()) setStarted(true)
    else setNeedName(true)
  }
  function onNamed(name) {
    setName(name)
    setNeedName(false)
    setStarted(true)
  }

  const Game = game.Component

  return (
    <div className="session" style={{ '--g1': game.g1, '--g2': game.g2 }}>
      <div className="session-top">
        <button className="icon-btn" onClick={onExit}>✕</button>
        <div className="session-title">
          <span>{game.emoji}</span> {game.name}
        </div>
        <span className="session-spacer" />
      </div>

      {locked ? (
        <LockedView game={game} onRanks={onRanks} onExit={onExit} />
      ) : result ? (
        <ResultView game={game} result={result} onRanks={onRanks} onExit={onExit} />
      ) : started ? (
        <Game rng={rng} onFinish={handleFinish} />
      ) : (
        <HowToPlay game={game} onStart={onStart} />
      )}

      {needName && <NameGate onSubmit={onNamed} onClose={() => setNeedName(false)} />}
    </div>
  )
}

function HowToPlay({ game, onStart }) {
  return (
    <div className="howto fade-in">
      <div className="howto-emoji" style={{ background: `linear-gradient(135deg, ${game.g1}, ${game.g2})` }}>
        {game.emoji}
      </div>
      <h2 className="howto-name">{game.name}</h2>
      <div className="howto-tag">{game.tag}</div>
      <div className="howto-card">
        <div className="howto-head">How to play</div>
        <ol className="howto-steps">
          {game.how.map((step, i) => (
            <li key={i}>
              <span className="hs-num">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <button className="primary-btn big" onClick={onStart}>Start ▸</button>
    </div>
  )
}

function LockedView({ game, onRanks, onExit }) {
  const p = getProfile()
  return (
    <div className="result fade-in">
      <div className="result-emoji">✅</div>
      <h2 className="locked-title">Done for today</h2>
      <p className="muted">
        You've already played <b>{game.name}</b> today
        {p.best[game.id] != null ? <> · scored {p.best[game.id]}</> : null}.
      </p>
      <p className="locked-sub">A fresh challenge unlocks tomorrow. Try another game meanwhile!</p>
      <button className="primary-btn big" onClick={onRanks}>🏆 View ranks</button>
      <button className="text-btn" onClick={onExit}>← Back to games</button>
    </div>
  )
}

function ResultView({ game, result, onRanks, onExit }) {
  const [board, setBoard] = useState(null) // null = loading

  useEffect(() => {
    let alive = true
    gameBoard(game.id, 'today').then((b) => {
      if (!alive) return
      // reflect my just-played score immediately (Supabase write may lag a moment)
      const uid = getUserId()
      const others = b.filter((r) => !r.me)
      const mine = b.find((r) => r.me)
      const myScore = Math.max(result.score, mine ? mine.score : 0)
      const merged = [...others, { name: myName(), score: myScore, uid, me: true }]
      merged.sort((a, x) => x.score - a.score)
      setBoard(merged.slice(0, 8))
    })
    return () => { alive = false }
  }, [game.id])

  const rank = board ? (board.findIndex((r) => r.me) + 1 || null) : null

  return (
    <div className="result fade-in">
      <div className="result-emoji">{game.emoji}</div>
      <div className="result-score">{result.score}</div>
      <div className="result-sum">{result.summary}</div>
      <div className="result-chips">
        <span className="rchip xp">+{result.xpGain} XP</span>
        {rank && <span className="rchip rank">#{rank} today</span>}
      </div>

      <div className="mini-board">
        <div className="mb-head">Today · {game.name}</div>
        {board === null ? (
          <div className="mb-row"><span className="mb-name" style={{ color: 'var(--muted)' }}>loading…</span></div>
        ) : (
          board.slice(0, 5).map((r, i) => (
            <div key={r.uid + '' + i} className={`mb-row ${r.me ? 'me' : ''}`}>
              <span className="mb-rank">{['🥇', '🥈', '🥉'][i] || i + 1}</span>
              <span className="mb-name">{r.name}</span>
              <span className="mb-score">{r.score}</span>
            </div>
          ))
        )}
      </div>

      <button className="primary-btn big" onClick={() => shareResult(game, result)}>
        📤 Share my score
      </button>
      <button className="secondary-btn big" onClick={onRanks}>🏆 Full leaderboard</button>
      <button className="text-btn" onClick={onExit}>← Back to games</button>
    </div>
  )
}

/* ----------------------------- ranks ------------------------------ */
function Ranks({ onBack, onChanged }) {
  const [sel, setSel] = useState('overall')
  const [scope, setScope] = useState('today')
  const [rows, setRows] = useState(null) // null = loading
  const [rank, setRank] = useState(null)
  const p = getProfile()
  const { lvl } = levelProgress(p.xp)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(p.name)

  useEffect(() => {
    let alive = true
    setRows(null)
    const fetcher = sel === 'overall' ? overallBoard(scope) : gameBoard(sel, scope)
    fetcher.then((r) => alive && setRows(r))
    return () => { alive = false }
  }, [sel, scope])

  useEffect(() => {
    let alive = true
    myDailyRank().then((r) => alive && setRank(r)).catch(() => {})
    return () => { alive = false }
  }, [])

  function saveName() {
    if (!nameInput.trim()) return
    setName(nameInput)
    setEditing(false)
    onChanged && onChanged()
  }

  return (
    <div className="ranks fade-in">
      <div className="board-head">
        <h2>🏆 Leaderboards</h2>
        <button className="ghost-btn" onClick={onBack}>← Back</button>
      </div>

      <div className="your-card">
        <div className="yc-av">{(p.name || 'P').slice(0, 1).toUpperCase()}</div>
        <div className="yc-main">
          {editing ? (
            <div className="name-row">
              <input className="name-input" value={nameInput} maxLength={16} onChange={(e) => setNameInput(e.target.value)} />
              <button className="primary-btn" onClick={saveName}>Save</button>
            </div>
          ) : (
            <>
              <div className="yc-name">{p.name || 'Player'} <span className="edit" onClick={() => setEditing(true)}>✎</span></div>
              <div className="yc-sub">🔥 {p.streak} day streak · Lv {lvl} · {p.xp} XP</div>
            </>
          )}
        </div>
        <div className="yc-rank"><b>{rank ? `#${rank}` : '—'}</b><span>today</span></div>
      </div>

      <div className="chip-scroll">
        <button className={`fchip ${sel === 'overall' ? 'on' : ''}`} onClick={() => setSel('overall')}>⭐ Overall</button>
        {GAMES.map((g) => (
          <button key={g.id} className={`fchip ${sel === g.id ? 'on' : ''}`} onClick={() => setSel(g.id)}>
            {g.emoji} {g.name}
          </button>
        ))}
      </div>

      {sel !== 'overall' && (
        <div className="tabs">
          <button className={`tab ${scope === 'today' ? 'active' : ''}`} onClick={() => setScope('today')}>Today</button>
          <button className={`tab ${scope === 'all' ? 'active' : ''}`} onClick={() => setScope('all')}>All time</button>
        </div>
      )}

      {rows === null ? (
        <p className="board-loading">Loading ranks…</p>
      ) : rows.length === 0 ? (
        <p className="empty">No scores yet. Be the first!</p>
      ) : (
        <ol className="board-list">
          {rows.map((r, i) => (
            <li key={r.uid + '' + i} className={`board-row rank-${i + 1} ${r.me ? 'me' : ''}`}>
              <span className="rank">{['🥇', '🥈', '🥉'][i] || i + 1}</span>
              <span className="lb-name">
                {r.name}
                {r.me && <span className="you-tag">you</span>}
              </span>
              <span className="lb-score">{r.score}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="muted small">
        {supabaseEnabled ? '🌐 Live leaderboard · synced across all players' : 'Saved on this device.'}
      </p>
    </div>
  )
}

/* ---------------------------- profile ----------------------------- */
function Profile({ onBack, onChanged }) {
  const p = getProfile()
  const { lvl, cur, span, pct } = levelProgress(p.xp)
  const [editing, setEditing] = useState(false)
  const [name, setNameInput] = useState(p.name)

  function save() {
    if (name.trim()) {
      setName(name)
      setEditing(false)
      onChanged()
    }
  }

  const playedBest = GAMES.filter((g) => p.best[g.id] != null)

  return (
    <div className="profile fade-in">
      <div className="board-head w100">
        <h2>You</h2>
        <button className="ghost-btn" onClick={onBack}>← Back</button>
      </div>

      <div className="avatar">{(p.name || 'P').slice(0, 1).toUpperCase()}</div>
      {editing ? (
        <div className="name-row">
          <input className="name-input" value={name} maxLength={16} onChange={(e) => setNameInput(e.target.value)} />
          <button className="primary-btn" onClick={save}>Save</button>
        </div>
      ) : (
        <div className="pname" onClick={() => setEditing(true)}>{p.name || 'Player'} <span className="edit">✎</span></div>
      )}

      <div className="lvl-line">Level {lvl}</div>
      <div className="xpbar big"><span style={{ width: `${pct}%` }} /></div>
      <div className="xp-cap">{cur} / {span} XP</div>

      <div className="stat-row">
        <div className="stat"><div className="stat-num">🔥 {p.streak}</div><div className="stat-label">day streak</div></div>
        <div className="stat"><div className="stat-num">{p.plays}</div><div className="stat-label">games played</div></div>
        <div className="stat"><div className="stat-num">{p.xp}</div><div className="stat-label">total XP</div></div>
      </div>

      <div className="section-head w100"><h2>Your best scores</h2></div>
      {playedBest.length === 0 ? (
        <p className="empty">Play a game to set your first score.</p>
      ) : (
        <div className="best-list">
          {playedBest.map((g) => (
            <div key={g.id} className="best-row">
              <span className="br-emoji">{g.emoji}</span>
              <span className="br-name">{g.name}</span>
              <span className="br-score">{p.best[g.id]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------------------- name gate --------------------------- */
function NameGate({ onSubmit, onClose }) {
  const [name, setName] = useState('')
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-emoji">👋</div>
        <h3>What's your name?</h3>
        <p className="muted">Shows up on the leaderboard. No sign-up, ever.</p>
        <input
          className="name-input big"
          autoFocus
          placeholder="Your name"
          value={name}
          maxLength={16}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSubmit(name)}
        />
        <button className="primary-btn big" disabled={!name.trim()} onClick={() => name.trim() && onSubmit(name)}>
          Let's go →
        </button>
      </div>
    </div>
  )
}
