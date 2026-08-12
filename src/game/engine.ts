import {
  BOARD_SIZE,
  COLORS,
  type Board,
  type Captures,
  type Color,
  type GameConfig,
  type GameState,
  type JumpStep,
  type Player,
  type Pos,
  completeSets,
  emptyCaptures,
  totalCaptured,
} from './types'

const DIRS: Pos[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
]

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

function posKey(p: Pos): string {
  return `${p.row},${p.col}`
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row])
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Build a filled 10×10 board, then clear the four center squares. */
export function createBoard(): Board {
  const pool: Color[] = []
  for (const color of COLORS) {
    for (let i = 0; i < 20; i++) pool.push(color)
  }
  const shuffled = shuffle(pool)
  const board: Board = Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => {
      return shuffled[row * BOARD_SIZE + col]
    }),
  )
  board[4][4] = null
  board[4][5] = null
  board[5][4] = null
  board[5][5] = null
  return board
}

export function createPlayers(config: GameConfig): Player[] {
  return Array.from({ length: config.playerCount }, (_, i) => {
    let name: string
    if (config.aiOpponents) {
      name = i === 0 ? 'You' : `AI ${i}`
    } else {
      name = `Player ${i + 1}`
    }
    return {
      id: i,
      name,
      isAI: config.aiOpponents && i > 0,
      captures: emptyCaptures(),
    }
  })
}

export function startGame(config: GameConfig): GameState {
  return {
    board: createBoard(),
    players: createPlayers(config),
    currentPlayerIndex: 0,
    phase: 'playing',
    turnChain: [],
    activePiece: null,
    winnerIds: [],
    lastMove: null,
  }
}

/**
 * Single orthogonal jump from `from`: over adjacent occupied, land on empty two steps away.
 * Board is always the current physical board (captures already removed mid-turn).
 */
export function getSingleJumpsFrom(board: Board, from: Pos): JumpStep[] {
  const piece = board[from.row]?.[from.col]
  if (!piece) return []

  const jumps: JumpStep[] = []
  for (const d of DIRS) {
    const over: Pos = { row: from.row + d.row, col: from.col + d.col }
    const to: Pos = { row: from.row + 2 * d.row, col: from.col + 2 * d.col }
    if (!inBounds(to.row, to.col)) continue

    const overColor = board[over.row][over.col]
    const land = board[to.row][to.col]
    if (!overColor || land !== null) continue

    jumps.push({
      from: { ...from },
      over: { ...over },
      to: { ...to },
      captured: overColor,
    })
  }
  return jumps
}

/** All legal single jumps available for starting or continuing a turn. */
export function getAvailableJumps(
  board: Board,
  activePiece: Pos | null,
): JumpStep[] {
  if (activePiece) {
    return getSingleJumpsFrom(board, activePiece)
  }

  const jumps: JumpStep[] = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!board[row][col]) continue
      jumps.push(...getSingleJumpsFrom(board, { row, col }))
    }
  }
  return jumps
}

export function hasAnyLegalJump(board: Board): boolean {
  return getAvailableJumps(board, null).length > 0
}

function executeJumpOnBoard(board: Board, jump: JumpStep): Board {
  const next = cloneBoard(board)
  const mover = next[jump.from.row][jump.from.col]
  next[jump.from.row][jump.from.col] = null
  next[jump.over.row][jump.over.col] = null
  next[jump.to.row][jump.to.col] = mover
  return next
}

export function applyJump(state: GameState, jump: JumpStep): GameState {
  if (state.phase !== 'playing') return state

  const available = getAvailableJumps(state.board, state.activePiece)
  const canonical = available.find(
    (j) =>
      j.from.row === jump.from.row &&
      j.from.col === jump.from.col &&
      j.to.row === jump.to.row &&
      j.to.col === jump.to.col,
  )
  if (!canonical) return state

  const board = executeJumpOnBoard(state.board, canonical)
  const turnChain = [...state.turnChain, canonical]
  const further = getSingleJumpsFrom(board, canonical.to)

  if (further.length === 0) {
    return commitTurn({
      ...state,
      board,
      turnChain,
      activePiece: null,
    })
  }

  return {
    ...state,
    board,
    turnChain,
    activePiece: { ...canonical.to },
  }
}

export function endTurn(state: GameState): GameState {
  if (state.phase !== 'playing') return state
  if (state.turnChain.length === 0) return state
  return commitTurn({ ...state, activePiece: null })
}

function commitTurn(state: GameState): GameState {
  const players = state.players.map((p) => ({
    ...p,
    captures: { ...p.captures },
  }))
  const player = players[state.currentPlayerIndex]
  for (const step of state.turnChain) {
    player.captures[step.captured] += 1
  }

  const lastMove = [...state.turnChain]
  const board = state.board

  if (!hasAnyLegalJump(board)) {
    return {
      ...state,
      board,
      players,
      turnChain: [],
      activePiece: null,
      lastMove,
      phase: 'ended',
      winnerIds: determineWinners(players),
    }
  }

  return {
    ...state,
    board,
    players,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % players.length,
    turnChain: [],
    activePiece: null,
    lastMove,
    phase: 'playing',
  }
}

export function determineWinners(players: Player[]): number[] {
  let bestSets = -1
  let bestTotal = -1
  const ids: number[] = []

  for (const p of players) {
    const sets = completeSets(p.captures)
    const total = totalCaptured(p.captures)
    if (sets > bestSets || (sets === bestSets && total > bestTotal)) {
      bestSets = sets
      bestTotal = total
      ids.length = 0
      ids.push(p.id)
    } else if (sets === bestSets && total === bestTotal) {
      ids.push(p.id)
    }
  }
  return ids
}

export function piecesWithMoves(board: Board): Pos[] {
  const jumps = getAvailableJumps(board, null)
  const seen = new Set<string>()
  const result: Pos[] = []
  for (const j of jumps) {
    const k = posKey(j.from)
    if (!seen.has(k)) {
      seen.add(k)
      result.push(j.from)
    }
  }
  return result
}

export function scoreJumpChain(captures: Captures, chain: JumpStep[]): number {
  const preview = { ...captures }
  for (const step of chain) {
    preview[step.captured] += 1
  }
  const sets = completeSets(preview)
  const total = totalCaptured(preview)
  let variance = 0
  for (const c of COLORS) {
    variance += preview[c] * preview[c]
  }
  // Prefer complete sets, then total pieces, then balanced colors (lower variance)
  return sets * 1000 + total * 10 - variance * 0.01 + chain.length * 0.5
}

const AI_MAX_DEPTH = 8
const AI_MAX_STARTS = 40

/** Find best multi-jump chain for AI (considers early stops). */
export function findBestChain(
  board: Board,
  captures: Captures,
): JumpStep[] | null {
  let starts = piecesWithMoves(board)
  if (starts.length > AI_MAX_STARTS) {
    // Sample when the board is crowded to keep turns snappy
    starts = shuffle(starts).slice(0, AI_MAX_STARTS)
  }

  let best: JumpStep[] | null = null
  let bestScore = -Infinity

  const explore = (currentBoard: Board, pos: Pos, chain: JumpStep[]) => {
    if (chain.length > 0) {
      const score = scoreJumpChain(captures, chain)
      if (score > bestScore) {
        bestScore = score
        best = [...chain]
      }
    }
    if (chain.length >= AI_MAX_DEPTH) return

    for (const jump of getSingleJumpsFrom(currentBoard, pos)) {
      const nextBoard = executeJumpOnBoard(currentBoard, jump)
      explore(nextBoard, jump.to, [...chain, jump])
    }
  }

  for (const start of starts) {
    explore(board, start, [])
  }

  return best
}

export function applyFullChain(state: GameState, chain: JumpStep[]): GameState {
  let next = state
  for (const step of chain) {
    if (next.phase !== 'playing') break
    // After first jump, activePiece is at the landing; map step.from accordingly
    const from =
      next.activePiece ??
      (next.turnChain.length === 0 ? step.from : next.turnChain[next.turnChain.length - 1].to)

    const available = getAvailableJumps(next.board, next.activePiece)
    const match = available.find(
      (j) => j.from.row === from.row && j.from.col === from.col && j.to.row === step.to.row && j.to.col === step.to.col,
    )
    if (!match) {
      // try match by to only when mid-turn
      const byTo = available.find((j) => j.to.row === step.to.row && j.to.col === step.to.col)
      if (!byTo) break
      next = applyJump(next, byTo)
    } else {
      next = applyJump(next, match)
    }

    // If turn auto-ended after no further jumps, done
    if (next.turnChain.length === 0 && next.activePiece === null) {
      // Either committed mid-chain last jump or something else
      // If there are remaining steps we intended, turn may have auto-ended because no further jumps
      break
    }
  }

  if (next.turnChain.length > 0) {
    next = endTurn(next)
  }
  return next
}
