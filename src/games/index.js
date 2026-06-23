import SchulteGrid from './SchulteGrid.jsx'
import StroopRush from './StroopRush.jsx'
import FlashMemory from './FlashMemory.jsx'
import OddOneOut from './OddOneOut.jsx'
import SpeedMath from './SpeedMath.jsx'
import TrueFalse from './TrueFalse.jsx'
import Sequence from './Sequence.jsx'
import Reaction from './Reaction.jsx'

// scoreKind: 'pts' shown as a number. All games rank higher = better.
export const GAMES = [
  {
    id: 'schulte',
    name: 'Schulte Grid',
    emoji: '🔢',
    tag: 'Focus',
    blurb: 'Tap 1→25 in order, fast',
    g1: '#7c5cff',
    g2: '#00d4ff',
    Component: SchulteGrid,
  },
  {
    id: 'stroop',
    name: 'Stroop Rush',
    emoji: '🎨',
    tag: 'Focus',
    blurb: 'Tap the ink colour, not the word',
    g1: '#ff5d6c',
    g2: '#ffb24a',
    Component: StroopRush,
  },
  {
    id: 'flash',
    name: 'Flash Memory',
    emoji: '🧠',
    tag: 'Memory',
    blurb: 'Watch the pattern, repeat it',
    g1: '#2ee6a6',
    g2: '#00d4ff',
    Component: FlashMemory,
  },
  {
    id: 'odd',
    name: 'Odd One Out',
    emoji: '👁️',
    tag: 'Attention',
    blurb: 'Spot the different tile',
    g1: '#b47bff',
    g2: '#ff5d6c',
    Component: OddOneOut,
  },
  {
    id: 'speed',
    name: 'Speed Math',
    emoji: '⚡',
    tag: 'Calc',
    blurb: 'Solve as many as you can',
    g1: '#ffd24a',
    g2: '#ff7a4a',
    Component: SpeedMath,
  },
  {
    id: 'truefalse',
    name: 'True or False',
    emoji: '⚖️',
    tag: 'Calc',
    blurb: 'Is the equation correct?',
    g1: '#4d8cff',
    g2: '#2ee6a6',
    Component: TrueFalse,
  },
  {
    id: 'sequence',
    name: 'Next in Line',
    emoji: '🔭',
    tag: 'Logic',
    blurb: 'Crack the number pattern',
    g1: '#00d4ff',
    g2: '#7c5cff',
    Component: Sequence,
  },
  {
    id: 'reaction',
    name: 'Reflex Tap',
    emoji: '⏱️',
    tag: 'Reflex',
    blurb: 'Tap the instant it turns green',
    g1: '#2ee6a6',
    g2: '#ffd24a',
    Component: Reaction,
  },
]

export const gameById = (id) => GAMES.find((g) => g.id === id)

// today's featured "Daily Challenge" rotates through the list by date
export function featuredGame(dateKey) {
  let h = 0
  for (let i = 0; i < dateKey.length; i++) h = (h * 31 + dateKey.charCodeAt(i)) >>> 0
  return GAMES[h % GAMES.length]
}
