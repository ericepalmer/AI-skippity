/**
 * Quick sanity checks for core jump/score rules.
 * Run: npx tsx src/game/engine.test.ts
 */
import {
  applyJump,
  createBoard,
  getSingleJumpsFrom,
  piecesWithMoves,
  startGame,
  determineWinners,
  endTurn,
} from './engine'
import type { Board, Player } from './types'
import { emptyCaptures } from './types'

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg)
}

// Board has empty center
const board = createBoard()
assert(board[4][4] === null && board[4][5] === null, 'center empty')
assert(board[5][4] === null && board[5][5] === null, 'center empty 2')
let filled = 0
for (const row of board) for (const c of row) if (c) filled++
assert(filled === 96, `expected 96 pieces, got ${filled}`)

// Manual jump: piece - adjacent - empty
const tiny: Board = Array.from({ length: 10 }, () => Array(10).fill(null))
tiny[0][0] = 'red'
tiny[0][1] = 'blue'
// land 0,2 empty
const jumps = getSingleJumpsFrom(tiny, { row: 0, col: 0 })
assert(jumps.length === 1, 'one jump right')
assert(jumps[0].captured === 'blue', 'captures blue')
assert(jumps[0].to.col === 2, 'lands at col 2')

// Multi-jump possible
tiny[0][3] = 'green'
// after jumping to 0,2 can jump over 0,3 to 0,4
const after1 = tiny.map((r) => [...r])
after1[0][0] = null
after1[0][1] = null
after1[0][2] = 'red'
const jumps2 = getSingleJumpsFrom(after1, { row: 0, col: 2 })
assert(jumps2.some((j) => j.to.col === 4 && j.captured === 'green'), 'chain possible')

// Start game + apply jump then optional end mid-chain
const state = startGame({ playerCount: 2, aiOpponents: false })
const movable = piecesWithMoves(state.board)
assert(movable.length > 0, 'opening has moves')

const firstFrom = movable[0]
const opts = getSingleJumpsFrom(state.board, firstFrom)
assert(opts.length > 0, 'selected piece can jump')
let next = applyJump(state, opts[0])
// if still mid-turn, can end early
if (next.turnChain.length > 0) {
  next = endTurn(next)
}
assert(next.currentPlayerIndex === 1, 'turn advanced')
assert(next.players[0].captures[opts[0].captured] === 1, 'captured counted')

// Scoring
const p1: Player = {
  id: 0,
  name: 'A',
  isAI: false,
  captures: { red: 3, yellow: 3, orange: 2, green: 3, blue: 3 },
}
const p2: Player = {
  id: 1,
  name: 'B',
  isAI: false,
  captures: { red: 5, yellow: 4, orange: 4, green: 4, blue: 4 },
}
// p1 sets = 2, p2 sets = 4
assert(determineWinners([p1, p2]).join() === '1', 'most sets wins')

// Tie sets, higher total
const p3: Player = {
  id: 0,
  name: 'A',
  isAI: false,
  captures: { red: 4, yellow: 4, orange: 4, green: 4, blue: 4 },
}
const p4: Player = {
  id: 1,
  name: 'B',
  isAI: false,
  captures: { red: 5, yellow: 4, orange: 4, green: 4, blue: 4 },
}
// both 4 sets, p4 has more total
assert(determineWinners([p3, p4]).join() === '1', 'tiebreak total')

console.log('All engine checks passed.')
// silence unused
void emptyCaptures
