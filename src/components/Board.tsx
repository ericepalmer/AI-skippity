import type { CSSProperties } from 'react'
import { BOARD_SIZE, COLORS, type Color, type JumpStep, type Pos } from '../game/types'

interface BoardProps {
  board: (Color | null)[][]
  selected: Pos | null
  movable: Pos[]
  landings: Pos[]
  lastJumpSquares: Pos[]
  /** AI chain to redraw after its turn (path + capture ghosts). */
  aiTrail: JumpStep[] | null
  midTurn: boolean
  onCellClick: (pos: Pos) => void
  disabled: boolean
}

function posEq(a: Pos, b: Pos): boolean {
  return a.row === b.row && a.col === b.col
}

function isIn(list: Pos[], pos: Pos): boolean {
  return list.some((p) => posEq(p, pos))
}

function cellCenter(pos: Pos): { x: number; y: number } {
  // Coordinates in a 0–1000 viewBox covering the 10×10 grid
  const step = 1000 / BOARD_SIZE
  return {
    x: (pos.col + 0.5) * step,
    y: (pos.row + 0.5) * step,
  }
}

function trailPathPoints(trail: JumpStep[]): string {
  if (trail.length === 0) return ''
  const points: { x: number; y: number }[] = [cellCenter(trail[0].from)]
  for (const step of trail) {
    points.push(cellCenter(step.to))
  }
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

export function Board({
  board,
  selected,
  movable,
  landings,
  lastJumpSquares,
  aiTrail,
  midTurn,
  onCellClick,
  disabled,
}: BoardProps) {
  const ghosts = new Map<string, Color>()
  if (aiTrail) {
    for (const step of aiTrail) {
      ghosts.set(`${step.over.row},${step.over.col}`, step.captured)
    }
  }

  const pathPoints = aiTrail?.length ? trailPathPoints(aiTrail) : ''

  return (
    <div
      className={['board', aiTrail?.length ? 'has-ai-trail' : '']
        .filter(Boolean)
        .join(' ')}
      role="grid"
      aria-label="Skippity board"
      aria-disabled={disabled}
    >
      {board.map((row, rowIndex) => (
        <div className="board-row" role="row" key={rowIndex}>
          {row.map((cell, colIndex) => {
            const pos = { row: rowIndex, col: colIndex }
            const isSelected = selected && posEq(selected, pos)
            const canMove = isIn(movable, pos)
            const canLand = isIn(landings, pos)
            const inLast = !aiTrail?.length && isIn(lastJumpSquares, pos)
            const checkered = (rowIndex + colIndex) % 2 === 0
            const ghostColor = ghosts.get(`${rowIndex},${colIndex}`)

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                role="gridcell"
                className={[
                  'cell',
                  checkered ? 'cell-a' : 'cell-b',
                  isSelected ? 'selected' : '',
                  canMove ? 'movable' : '',
                  canLand ? 'landing' : '',
                  inLast ? 'last-move' : '',
                  midTurn && !canLand && !isSelected ? 'dim' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onCellClick(pos)}
                disabled={disabled}
                aria-label={
                  cell
                    ? `${cell} skipper at row ${rowIndex + 1}, column ${colIndex + 1}`
                    : `Empty square at row ${rowIndex + 1}, column ${colIndex + 1}`
                }
              >
                {ghostColor && (
                  <span
                    className={`skipper skipper-ghost skipper-${ghostColor}`}
                    aria-hidden
                    title={`AI captured ${ghostColor}`}
                  />
                )}
                {cell && (
                  <span
                    className={`skipper skipper-${cell}`}
                    data-color={cell}
                    style={
                      {
                        '--skip-i': COLORS.indexOf(cell),
                      } as CSSProperties
                    }
                  />
                )}
                {canLand && <span className="landing-dot" aria-hidden />}
              </button>
            )
          })}
        </div>
      ))}

      {pathPoints && (
        <svg
          className="ai-trail-svg"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          aria-hidden
        >
          <polyline
            className="ai-trail-line-glow"
            points={pathPoints}
            fill="none"
          />
          <polyline className="ai-trail-line" points={pathPoints} fill="none" />
          {/* step markers at each hop landing (and origin) */}
          {aiTrail &&
            [aiTrail[0].from, ...aiTrail.map((s) => s.to)].map((pos, i) => {
              const c = cellCenter(pos)
              return (
                <circle
                  key={`m-${i}-${pos.row}-${pos.col}`}
                  className={i === 0 ? 'ai-trail-dot start' : 'ai-trail-dot'}
                  cx={c.x}
                  cy={c.y}
                  r={i === 0 || i === aiTrail.length ? 18 : 12}
                />
              )
            })}
        </svg>
      )}
    </div>
  )
}
