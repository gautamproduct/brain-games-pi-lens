import SchulteGrid from './SchulteGrid.jsx'
import StroopRush from './StroopRush.jsx'
import FlashMemory from './FlashMemory.jsx'
import OddOneOut from './OddOneOut.jsx'
import SpeedMath from './SpeedMath.jsx'
import TrueFalse from './TrueFalse.jsx'
import Sequence from './Sequence.jsx'
import Reaction from './Reaction.jsx'

export const GAMES = [
  {
    id: 'schulte',
    name: 'Schulte Grid',
    emoji: '🔢',
    tag: 'Focus',
    blurb: 'Tap 1→25 in order, fast',
    g1: '#7c5cff',
    g2: '#00d4ff',
    how: [
      'Numbers 1–25 are scattered in a 5×5 grid.',
      'Tap them in order: 1, then 2, then 3…',
      'Keep your eyes near the centre — train your side vision.',
      'A wrong tap adds +1s. Finish as fast as you can.',
    ],
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
    how: [
      'A colour word appears — but in a different ink colour.',
      'Tap the colour of the INK, not what the word says.',
      'e.g. “GREEN” written in blue → tap Blue.',
      'Score = correct answers in 30 seconds.',
    ],
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
    how: [
      'Tiles light up one by one — watch closely.',
      'Then tap them back in the same order.',
      'Each level adds one more tile.',
      'One wrong tile ends the run. How far can you go?',
    ],
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
    how: [
      'Every tile is the same colour — except one.',
      'Tap the tile that looks slightly different.',
      'Each round the difference shrinks and the grid grows.',
      'A wrong tap costs −2s. Clear as many as you can in 45s.',
    ],
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
    how: [
      'A sum appears with four answer choices.',
      'Tap the correct answer as fast as you can.',
      'No typing — just tap.',
      'Score = correct answers in 45 seconds.',
    ],
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
    how: [
      'An equation flashes, e.g. 7 × 8 = 54.',
      'Decide quickly: is it True or False?',
      'Tap ✓ True or ✗ False.',
      'Score = correct answers in 30 seconds.',
    ],
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
    how: [
      'A number sequence is shown with the last one missing.',
      'Work out the pattern (add, multiply, squares…).',
      'Tap the number that comes next.',
      'Score = correct answers in 60 seconds.',
    ],
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
    how: [
      'Wait for the panel to turn green.',
      'The moment it does, tap as fast as you can.',
      "Don't jump early — that resets the trial.",
      '5 trials. A faster average means a higher score.',
    ],
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
