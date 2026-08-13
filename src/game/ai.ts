import {
  applyFullChain,
  determineWinners,
  findChainForDifficulty,
  hasAnyLegalJump,
} from './engine'
import { emptyCaptures, type GameState } from './types'

export function makeAIMove(state: GameState): GameState {
  if (state.phase !== 'playing') return state
  const player = state.players[state.currentPlayerIndex]
  if (!player.isAI) return state

  if (!hasAnyLegalJump(state.board)) {
    return {
      ...state,
      phase: 'ended',
      winnerIds: determineWinners(state.players),
    }
  }

  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length
  const opponent = state.players[nextIndex]
  const opponentCaptures = opponent?.captures ?? emptyCaptures()

  const chain = findChainForDifficulty(
    state.board,
    player.captures,
    state.aiDifficulty,
    opponentCaptures,
  )
  if (!chain || chain.length === 0) {
    return {
      ...state,
      phase: 'ended',
      winnerIds: determineWinners(state.players),
    }
  }
  return applyFullChain(state, chain)
}
