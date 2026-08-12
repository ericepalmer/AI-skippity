export const BOARD_SIZE = 10

export const COLORS = ['red', 'yellow', 'orange', 'green', 'blue'] as const
export type Color = (typeof COLORS)[number]

export type Cell = Color | null

export type Board = Cell[][]

export interface Pos {
  row: number
  col: number
}

export interface JumpStep {
  from: Pos
  over: Pos
  to: Pos
  captured: Color
}

/** Counts of each color in a player's collection. */
export type Captures = Record<Color, number>

export interface Player {
  id: number
  name: string
  isAI: boolean
  captures: Captures
}

export type Phase = 'setup' | 'playing' | 'ended'

export interface GameConfig {
  playerCount: 2 | 3 | 4
  aiOpponents: boolean
}

export interface GameState {
  board: Board
  players: Player[]
  currentPlayerIndex: number
  phase: Phase
  /** Sequence of jumps in the current turn (committed as we go). */
  turnChain: JumpStep[]
  /** Piece currently mid multi-jump, if any. */
  activePiece: Pos | null
  winnerIds: number[]
  lastMove: JumpStep[] | null
}

export function emptyCaptures(): Captures {
  return { red: 0, yellow: 0, orange: 0, green: 0, blue: 0 }
}

export function completeSets(captures: Captures): number {
  return Math.min(...COLORS.map((c) => captures[c]))
}

export function totalCaptured(captures: Captures): number {
  return COLORS.reduce((sum, c) => sum + captures[c], 0)
}
