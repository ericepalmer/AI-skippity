import {
  COLORS,
  type Player,
  completeSets,
  totalCaptured,
} from '../game/types'

interface ScorePanelProps {
  players: Player[]
  currentPlayerIndex: number
  winnerIds: number[]
  phase: 'playing' | 'ended' | 'setup'
}

export function ScorePanel({
  players,
  currentPlayerIndex,
  winnerIds,
  phase,
}: ScorePanelProps) {
  return (
    <div className="score-panel">
      {players.map((player, index) => {
        const sets = completeSets(player.captures)
        const total = totalCaptured(player.captures)
        const isActive = phase === 'playing' && index === currentPlayerIndex
        const isWinner = phase === 'ended' && winnerIds.includes(player.id)

        return (
          <article
            key={player.id}
            className={[
              'player-card',
              isActive ? 'active' : '',
              isWinner ? 'winner' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <header className="player-card-head">
              <h2>{player.name}</h2>
              {isActive && <span className="turn-badge">Turn</span>}
              {isWinner && <span className="win-badge">Winner</span>}
            </header>
            <p className="sets-line">
              <strong>{sets}</strong>{' '}
              {sets === 1 ? 'complete set' : 'complete sets'}
              <span className="muted"> · {total} skippers</span>
            </p>
            <ul className="color-stacks">
              {COLORS.map((color) => (
                <li key={color}>
                  <span className={`stack-dot skipper-${color}`} aria-hidden />
                  <span className="stack-count">{player.captures[color]}</span>
                  <span className="sr-only">{color}</span>
                </li>
              ))}
            </ul>
          </article>
        )
      })}
    </div>
  )
}
