import { useCallback, useEffect, useMemo, useState } from 'react'
import { Board } from './components/Board'
import { ScorePanel } from './components/ScorePanel'
import { SetupScreen } from './components/SetupScreen'
import { makeAIMove } from './game/ai'
import {
  applyJump,
  endTurn,
  getAvailableJumps,
  getSingleJumpsFrom,
  piecesWithMoves,
  startGame,
} from './game/engine'
import type { GameConfig, GameState, JumpStep, Pos } from './game/types'
import { completeSets, totalCaptured } from './game/types'
import './App.css'

export default function App() {
  const [state, setState] = useState<GameState | null>(null)
  const [selected, setSelected] = useState<Pos | null>(null)
  /** Visual review of the AI's last completed chain. */
  const [aiTrail, setAiTrail] = useState<JumpStep[] | null>(null)

  const current = state?.players[state.currentPlayerIndex]
  const midTurn = Boolean(state && state.turnChain.length > 0)
  const humanCanPlay =
    state?.phase === 'playing' && Boolean(current) && !current?.isAI

  // Clear AI path preview on any pointer interaction
  useEffect(() => {
    if (!aiTrail?.length) return
    const clear = () => setAiTrail(null)
    window.addEventListener('pointerdown', clear, true)
    return () => window.removeEventListener('pointerdown', clear, true)
  }, [aiTrail])

  // AI turns
  useEffect(() => {
    if (!state || state.phase !== 'playing') return
    const player = state.players[state.currentPlayerIndex]
    if (!player.isAI) return
    // only act at start of AI turn
    if (state.turnChain.length > 0) return

    const timer = window.setTimeout(() => {
      setState((s) => {
        if (!s || s.phase !== 'playing') return s
        if (!s.players[s.currentPlayerIndex]?.isAI) return s
        if (s.turnChain.length > 0) return s
        const next = makeAIMove(s)
        if (next.lastMove?.length) {
          // Defer so we don't nest setState; show trail after the move lands
          queueMicrotask(() => setAiTrail([...next.lastMove!]))
        }
        return next
      })
      setSelected(null)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [state])

  const movable = useMemo(() => {
    if (!state || state.phase !== 'playing' || !humanCanPlay) return []
    if (midTurn && state.activePiece) {
      return [state.activePiece]
    }
    return piecesWithMoves(state.board)
  }, [state, humanCanPlay, midTurn])

  const landings = useMemo(() => {
    if (!state || !humanCanPlay) return []
    if (midTurn && state.activePiece) {
      return getSingleJumpsFrom(state.board, state.activePiece).map((j) => j.to)
    }
    if (!selected) return []
    return getAvailableJumps(state.board, null)
      .filter((j) => j.from.row === selected.row && j.from.col === selected.col)
      .map((j) => j.to)
  }, [state, selected, humanCanPlay, midTurn])

  const lastJumpSquares = useMemo(() => {
    if (!state?.lastMove?.length) return []
    const squares: Pos[] = []
    for (const step of state.lastMove) {
      squares.push(step.from, step.over, step.to)
    }
    return squares
  }, [state?.lastMove])

  const handleStart = useCallback((config: GameConfig) => {
    setState(startGame(config))
    setSelected(null)
    setAiTrail(null)
  }, [])

  const handleCellClick = useCallback(
    (pos: Pos) => {
      if (!state || state.phase !== 'playing' || !humanCanPlay) return

      if (midTurn && state.activePiece) {
        const jump = getSingleJumpsFrom(state.board, state.activePiece).find(
          (j) => j.to.row === pos.row && j.to.col === pos.col,
        )
        if (jump) {
          setState((s) => (s ? applyJump(s, jump) : s))
        }
        return
      }

      if (selected) {
        const jump = getAvailableJumps(state.board, null).find(
          (j) =>
            j.from.row === selected.row &&
            j.from.col === selected.col &&
            j.to.row === pos.row &&
            j.to.col === pos.col,
        )
        if (jump) {
          setState((s) => (s ? applyJump(s, jump) : s))
          setSelected(null)
          return
        }
      }

      const canSelect = movable.some(
        (m) => m.row === pos.row && m.col === pos.col,
      )
      if (canSelect) {
        setSelected(pos)
      } else {
        setSelected(null)
      }
    },
    [state, humanCanPlay, midTurn, selected, movable],
  )

  const handleEndTurn = useCallback(() => {
    setState((s) => (s ? endTurn(s) : s))
    setSelected(null)
  }, [])

  const handleNewGame = useCallback(() => {
    setState(null)
    setSelected(null)
    setAiTrail(null)
  }, [])

  if (!state) {
    return (
      <div className="app">
        <SetupScreen onStart={handleStart} />
      </div>
    )
  }

  const activePiecePos = midTurn ? state.activePiece : selected

  return (
    <div className="app playing">
      <header className="top-bar">
        <div>
          <h1 className="brand-sm">Skippity</h1>
          {state.phase === 'playing' && (
            <p className="status">
              {current?.isAI
                ? `${current.name} is jumping…`
                : aiTrail?.length
                  ? 'AI path shown — click anywhere to clear'
                  : midTurn
                    ? 'Keep jumping, or end your turn'
                    : `${current?.name}'s turn — select a glowing skipper`}
            </p>
          )}
          {state.phase === 'ended' && (
            <p className="status result">
              {state.winnerIds.length === 1
                ? `${state.players.find((p) => p.id === state.winnerIds[0])?.name} wins!`
                : `Tie: ${state.winnerIds
                    .map((id) => state.players.find((p) => p.id === id)?.name)
                    .join(' & ')}`}
              {' · '}
              {state.players
                .map(
                  (p) =>
                    `${p.name}: ${completeSets(p.captures)} set${
                      completeSets(p.captures) === 1 ? '' : 's'
                    } (${totalCaptured(p.captures)})`,
                )
                .join(' · ')}
            </p>
          )}
        </div>
        <div className="top-actions">
          {midTurn && humanCanPlay && (
            <button type="button" className="secondary-btn" onClick={handleEndTurn}>
              End turn
            </button>
          )}
          <button type="button" className="ghost-btn" onClick={handleNewGame}>
            New game
          </button>
        </div>
      </header>

      <main className="table">
        <ScorePanel
          players={state.players}
          currentPlayerIndex={state.currentPlayerIndex}
          winnerIds={state.winnerIds}
          phase={state.phase}
        />
        <Board
          board={state.board}
          selected={activePiecePos}
          movable={movable}
          landings={landings}
          lastJumpSquares={lastJumpSquares}
          aiTrail={aiTrail}
          midTurn={midTurn}
          onCellClick={handleCellClick}
          disabled={!humanCanPlay || state.phase === 'ended'}
        />
      </main>
    </div>
  )
}
