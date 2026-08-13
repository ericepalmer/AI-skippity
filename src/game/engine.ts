import {
  BOARD_SIZE,
  COLORS,
  type AiDifficulty,
  type Board,
  type Captures,
  type Color,
  type GameConfig,
  type GameState,
  type JumpStep,
  type Player,
  type Pos,
  AI_DIFFICULTY_LABELS,
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
      name =
        i === 0
          ? 'You'
          : config.playerCount === 2
            ? `AI (${AI_DIFFICULTY_LABELS[config.aiDifficulty]})`
            : `AI ${i} (${AI_DIFFICULTY_LABELS[config.aiDifficulty]})`
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
  const players = createPlayers(config)
  return {
    board: createBoard(),
    players,
    currentPlayerIndex: Math.floor(Math.random() * players.length),
    phase: 'playing',
    turnChain: [],
    activePiece: null,
    winnerIds: [],
    lastMove: null,
    confirmTurns: false,
    aiDifficulty: config.aiDifficulty,
    turnStartBoard: null,
    awaitingConfirm: false,
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

function shouldHoldForConfirm(state: GameState): boolean {
  return (
    state.confirmTurns && !state.players[state.currentPlayerIndex]?.isAI
  )
}

function holdForConfirm(state: GameState): GameState {
  return {
    ...state,
    activePiece: null,
    awaitingConfirm: true,
  }
}

export function applyJump(state: GameState, jump: JumpStep): GameState {
  if (state.phase !== 'playing' || state.awaitingConfirm) return state

  const available = getAvailableJumps(state.board, state.activePiece)
  const canonical = available.find(
    (j) =>
      j.from.row === jump.from.row &&
      j.from.col === jump.from.col &&
      j.to.row === jump.to.row &&
      j.to.col === jump.to.col,
  )
  if (!canonical) return state

  const turnStartBoard =
    state.turnChain.length === 0
      ? cloneBoard(state.board)
      : state.turnStartBoard

  const board = executeJumpOnBoard(state.board, canonical)
  const turnChain = [...state.turnChain, canonical]
  const further = getSingleJumpsFrom(board, canonical.to)

  const nextBase: GameState = {
    ...state,
    board,
    turnChain,
    turnStartBoard,
  }

  if (further.length === 0) {
    if (shouldHoldForConfirm(nextBase)) {
      return holdForConfirm(nextBase)
    }
    return commitTurn({
      ...nextBase,
      activePiece: null,
    })
  }

  return {
    ...nextBase,
    activePiece: { ...canonical.to },
    awaitingConfirm: false,
  }
}

/** Stop jumping early (still may need Confirm if that option is on). */
export function endTurn(state: GameState): GameState {
  if (state.phase !== 'playing') return state
  if (state.turnChain.length === 0) return state
  if (state.awaitingConfirm) return state

  const stopped = { ...state, activePiece: null }
  if (shouldHoldForConfirm(stopped)) {
    return holdForConfirm(stopped)
  }
  return commitTurn(stopped)
}

/** Toggle confirm-before-hand-off during an active game. */
export function setConfirmTurns(state: GameState, enabled: boolean): GameState {
  if (state.confirmTurns === enabled) return state
  // Turning confirm off while held: commit so the game isn't stuck
  if (!enabled && state.awaitingConfirm) {
    return confirmTurn({ ...state, confirmTurns: false })
  }
  return { ...state, confirmTurns: enabled }
}

/** Confirm a held turn and hand off to the next player. */
export function confirmTurn(state: GameState): GameState {
  if (state.phase !== 'playing') return state
  if (!state.awaitingConfirm || state.turnChain.length === 0) return state
  return commitTurn({ ...state, awaitingConfirm: false, activePiece: null })
}

/** Undo the entire current turn back to its start. */
export function undoTurn(state: GameState): GameState {
  if (state.phase !== 'playing') return state
  if (!state.turnStartBoard || state.turnChain.length === 0) return state
  return {
    ...state,
    board: cloneBoard(state.turnStartBoard),
    turnChain: [],
    activePiece: null,
    awaitingConfirm: false,
    turnStartBoard: null,
  }
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
      turnStartBoard: null,
      awaitingConfirm: false,
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
    turnStartBoard: null,
    awaitingConfirm: false,
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

interface ScoredChain {
  chain: JumpStep[]
  score: number
  boardAfter: Board
}

function enumerateChains(
  board: Board,
  captures: Captures,
  maxDepth: number,
  maxStarts: number,
): ScoredChain[] {
  let starts = piecesWithMoves(board)
  if (starts.length > maxStarts) {
    starts = shuffle(starts).slice(0, maxStarts)
  }

  const results: ScoredChain[] = []

  const explore = (currentBoard: Board, pos: Pos, chain: JumpStep[]) => {
    if (chain.length > 0) {
      results.push({
        chain: [...chain],
        score: scoreJumpChain(captures, chain),
        boardAfter: cloneBoard(currentBoard),
      })
    }
    if (chain.length >= maxDepth) return

    for (const jump of getSingleJumpsFrom(currentBoard, pos)) {
      const nextBoard = executeJumpOnBoard(currentBoard, jump)
      explore(nextBoard, jump.to, [...chain, jump])
    }
  }

  for (const start of starts) {
    explore(board, start, [])
  }

  return results
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

/** Greedy best chain (medium baseline). */
export function findBestChain(
  board: Board,
  captures: Captures,
): JumpStep[] | null {
  const chains = enumerateChains(board, captures, 8, 40)
  if (chains.length === 0) return null
  chains.sort((a, b) => b.score - a.score)
  return chains[0].chain
}

/**
 * Easy: short, weak, often random — most kids can win.
 * Medium: greedy set-building with a little noise.
 * Hard: greedy plus denial — avoid leaving the opponent a strong reply.
 */
export function findChainForDifficulty(
  board: Board,
  captures: Captures,
  difficulty: AiDifficulty,
  opponentCaptures: Captures = emptyCaptures(),
): JumpStep[] | null {
  if (difficulty === 'easy') {
    const chains = enumerateChains(board, captures, 2, 24)
    if (chains.length === 0) return null
    // Prefer short / low-scoring moves; sometimes pure random
    if (Math.random() < 0.55) {
      const singles = chains.filter((c) => c.chain.length === 1)
      const pool = singles.length > 0 ? singles : chains
      pool.sort((a, b) => a.score - b.score)
      const weak = pool.slice(0, Math.max(1, Math.ceil(pool.length * 0.45)))
      return pickRandom(weak).chain
    }
    return pickRandom(chains).chain
  }

  if (difficulty === 'medium') {
    const chains = enumerateChains(board, captures, 7, 36)
    if (chains.length === 0) return null
    chains.sort((a, b) => b.score - a.score)
    // Usually best; sometimes 2nd/3rd so a practiced player can outplay it
    if (chains.length >= 3 && Math.random() < 0.28) {
      return chains[1 + Math.floor(Math.random() * 2)].chain
    }
    if (chains.length >= 2 && Math.random() < 0.12) {
      return chains[1].chain
    }
    return chains[0].chain
  }

  // Hard: maximize own value while minimizing opponent's best follow-up
  const chains = enumerateChains(board, captures, 8, 32)
  if (chains.length === 0) return null

  let best: JumpStep[] | null = null
  let bestScore = -Infinity

  // Cap evaluation for speed
  const candidates = chains
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(chains.length, 48))

  for (const candidate of candidates) {
    const oppChains = enumerateChains(
      candidate.boardAfter,
      opponentCaptures,
      6,
      28,
    )
    const oppBest =
      oppChains.length === 0
        ? 0
        : Math.max(...oppChains.map((c) => c.score))
    // Strong weight on denial so it avoids handing you big turns
    const denial = oppBest * 0.85
    const adjusted = candidate.score - denial + candidate.chain.length * 0.2
    if (adjusted > bestScore) {
      bestScore = adjusted
      best = candidate.chain
    }
  }

  return best
}

export function applyFullChain(state: GameState, chain: JumpStep[]): GameState {
  // AI never uses confirm-hold
  const aiState = { ...state, confirmTurns: false }
  let next = aiState
  for (const step of chain) {
    if (next.phase !== 'playing') break
    const from =
      next.activePiece ??
      (next.turnChain.length === 0
        ? step.from
        : next.turnChain[next.turnChain.length - 1].to)

    const available = getAvailableJumps(next.board, next.activePiece)
    const match = available.find(
      (j) =>
        j.from.row === from.row &&
        j.from.col === from.col &&
        j.to.row === step.to.row &&
        j.to.col === step.to.col,
    )
    if (!match) {
      const byTo = available.find(
        (j) => j.to.row === step.to.row && j.to.col === step.to.col,
      )
      if (!byTo) break
      next = applyJump(next, byTo)
    } else {
      next = applyJump(next, match)
    }

    if (next.turnChain.length === 0 && next.activePiece === null) {
      break
    }
  }

  if (next.turnChain.length > 0) {
    next = endTurn(next)
  }
  // Restore confirmTurns flag for subsequent human turns
  return { ...next, confirmTurns: state.confirmTurns }
}
