import { useMemo, useState } from 'react'
import Logo from './Logo.jsx'
import { GAMES, gameById, featuredGame } from './games/index.js'
import { dailyRng, makeRng, todayKey } from './lib/rng.js'
import {
  getProfile,
  hasName,
  setName,
  finishSession,
  recordScore,
  getBoard,
  getOverallBoard,
  levelProgress,
  myName,
  playedTodayIds,
  myRankToday,
} from './lib/store.js'

const PI_LENS_URL = 'https://play.google.com/store/apps/details?id=live.pw.pilens'

export default function App() {
  const [tab, setTab] = useState('home') // home | ranks | profile
  const [session, setSession] = useState(null) // { game, practice }
  const [pending, setPending] = useState(null) // game waiting on name gate
  const [, force] = useState(0)
  const refresh = () => force((n) => n + 1)

  function launch(game, practice = false) {
    if (!hasName()) {
      setPending({ game, practice })
      return
    }
    setSession({ game, practice })
  }

  function onNamed(name) {
    setName(name)
    const p = pending
    setPending(null)
    if (p) setSession({ game: p.game, practice: p.practice })
    refresh()
  }

  return (
    <div className="app">
      <Header onProfile={() => setTab('profile')} />

      <main className="stage">
        {tab === 'home' && <Home onPlay={launch} />}
        {tab === 'ranks' && <Ranks />}
        {tab === 'profile' && <Profile onChanged={refresh} />}
      </main>

      <BottomNav tab={tab} setTab={setTab} />

      {pending && <NameGate onSubmit={onNamed} onClose={() => setPending(null)} />}
      {session && (
        <Session
          game={session.game}
          practice={session.practice}
          onExit={() => {
            setSession(null)
            refresh()
          }}
          onReplay={(g) => setSession({ game: g, practice: true })}
        />
      )}
    </div>
  )
}

/* ----------------------------- chrome ----------------------------- */
function Header({ onProfile }) {
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
      <button className="streak-chip" onClick={onProfile}>
        <span className="flame">🔥</span>
        <b>{p.streak}</b>
        <span className="lvl-mini">Lv {lvl}</span>
        <span className="xpbar"><span style={{ width: `${pct}%` }} /></span>
      </button>
    </header>
  )
}

function BottomNav({ tab, setTab }) {
  const items = [
    ['home', '🎮', 'Play'],
    ['ranks', '🏆', 'Ranks'],
  ]
  return (
    <nav className="bottomnav">
      {items.map(([id, icon, label]) => (
        <button
          key={id}
          className={`navitem ${tab === id ? 'active' : ''}`}
          onClick={() => setTab(id)}
        >
          <span className="navicon">{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  )
}

/* ------------------------------ home ------------------------------ */
function Home({ onPlay }) {
  const done = useMemo(() => playedTodayIds(), [])
  const featured = featuredGame(todayKey())
  const p = getProfile()

  return (
    <div className="home fade-in">
      <DailyHero game={featured} onPlay={onPlay} done={done.has(featured.id)} />

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
              {done.has(g.id) ? (
                <span className="gc-done">✓ {p.best[g.id] ?? ''}</span>
              ) : (
                <span className="gc-play">Play ▸</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function DailyHero({ game, onPlay, done }) {
  return (
    <button
      className="daily-hero"
      style={{ '--g1': game.g1, '--g2': game.g2 }}
      onClick={() => onPlay(game)}
    >
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
      <div className="dh-cta">{done ? 'Play again ▸' : 'Start ▸'}</div>
    </button>
  )
}

/* ---------------------------- session ----------------------------- */
function Session({ game, practice, onExit, onReplay }) {
  const [result, setResult] = useState(null)
  const [started, setStarted] = useState(practice) // replays skip the how-to
  // daily seed by default; practice uses a fresh random seed each mount
  const rng = useMemo(
    () => (practice ? makeRng(`${game.id}:practice:${Math.random()}`) : dailyRng(game.id)),
    [game.id, practice],
  )

  function handleFinish({ score, summary }) {
    const xpGain = Math.round(score) // XP = points earned; stays 1–2 digit
    finishSession(game.id, score, xpGain)
    recordScore(game.id, score, summary)
    setResult({ score, summary, xpGain, rank: myRankToday(game.id) })
  }

  const Game = game.Component

  return (
    <div className="session" style={{ '--g1': game.g1, '--g2': game.g2 }}>
      <div className="session-top">
        <button className="icon-btn" onClick={onExit}>
          ✕
        </button>
        <div className="session-title">
          <span>{game.emoji}</span> {game.name}
          {practice && <span className="prac-tag">practice</span>}
        </div>
        <span className="session-spacer" />
      </div>

      {result ? (
        <ResultView
          game={game}
          result={result}
          onReplay={() => {
            setResult(null)
            onReplay(game)
          }}
          onExit={onExit}
        />
      ) : started ? (
        <Game rng={rng} onFinish={handleFinish} />
      ) : (
        <HowToPlay game={game} onStart={() => setStarted(true)} />
      )}
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

      <button className="primary-btn big" onClick={onStart}>
        Start ▸
      </button>
    </div>
  )
}

function ResultView({ game, result, onReplay, onExit }) {
  const board = useMemo(() => getBoard(game.id, 'today'), [game.id])
  const me = myName()
  return (
    <div className="result fade-in">
      <div className="result-emoji">{game.emoji}</div>
      <div className="result-score">{result.score}</div>
      <div className="result-sum">{result.summary}</div>
      <div className="result-chips">
        <span className="rchip xp">+{result.xpGain} XP</span>
        {result.rank && <span className="rchip rank">#{result.rank} today</span>}
      </div>

      <div className="mini-board">
        <div className="mb-head">Today · {game.name}</div>
        {board.slice(0, 5).map((r, i) => (
          <div key={r.ts} className={`mb-row ${r.name === me ? 'me' : ''}`}>
            <span className="mb-rank">{['🥇', '🥈', '🥉'][i] || i + 1}</span>
            <span className="mb-name">{r.name}</span>
            <span className="mb-score">{r.score}</span>
          </div>
        ))}
      </div>

      <button className="primary-btn big" onClick={onReplay}>
        ↻ Play again
      </button>
      <button className="text-btn" onClick={onExit}>
        Back to games
      </button>
    </div>
  )
}

/* ----------------------------- ranks ------------------------------ */
function Ranks() {
  const [sel, setSel] = useState('overall')
  const [scope, setScope] = useState('today')
  const me = myName()
  const rows =
    sel === 'overall' ? getOverallBoard() : getBoard(sel, scope)

  return (
    <div className="ranks fade-in">
      <h2 className="ranks-title">🏆 Leaderboards</h2>

      <div className="chip-scroll">
        <button className={`fchip ${sel === 'overall' ? 'on' : ''}`} onClick={() => setSel('overall')}>
          ⭐ Overall
        </button>
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={`fchip ${sel === g.id ? 'on' : ''}`}
            onClick={() => setSel(g.id)}
          >
            {g.emoji} {g.name}
          </button>
        ))}
      </div>

      {sel !== 'overall' && (
        <div className="tabs">
          <button className={`tab ${scope === 'today' ? 'active' : ''}`} onClick={() => setScope('today')}>
            Today
          </button>
          <button className={`tab ${scope === 'all' ? 'active' : ''}`} onClick={() => setScope('all')}>
            All time
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="empty">No scores yet. Go play!</p>
      ) : (
        <ol className="board-list">
          {rows.map((r, i) => (
            <li key={(r.ts || r.name) + i} className={`board-row rank-${i + 1} ${r.name === me ? 'me' : ''}`}>
              <span className="rank">{['🥇', '🥈', '🥉'][i] || i + 1}</span>
              <span className="lb-name">
                {r.name}
                {r.name === me && <span className="you-tag">you</span>}
              </span>
              <span className="lb-score">{r.score}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="muted small">
        Scores saved on this device. Hook up a backend for a shared board.
      </p>
    </div>
  )
}

/* ---------------------------- profile ----------------------------- */
function Profile({ onChanged }) {
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
      <div className="avatar">{(p.name || 'P').slice(0, 1).toUpperCase()}</div>
      {editing ? (
        <div className="name-row">
          <input className="name-input" value={name} maxLength={16} onChange={(e) => setNameInput(e.target.value)} />
          <button className="primary-btn" onClick={save}>Save</button>
        </div>
      ) : (
        <div className="pname" onClick={() => setEditing(true)}>
          {p.name || 'Player'} <span className="edit">✎</span>
        </div>
      )}

      <div className="lvl-line">Level {lvl}</div>
      <div className="xpbar big"><span style={{ width: `${pct}%` }} /></div>
      <div className="xp-cap">{cur} / {span} XP</div>

      <div className="stat-row">
        <div className="stat"><div className="stat-num">🔥 {p.streak}</div><div className="stat-label">day streak</div></div>
        <div className="stat"><div className="stat-num">{p.plays}</div><div className="stat-label">games played</div></div>
        <div className="stat"><div className="stat-num">{p.xp}</div><div className="stat-label">total XP</div></div>
      </div>

      <div className="section-head"><h2>Your best scores</h2></div>
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
