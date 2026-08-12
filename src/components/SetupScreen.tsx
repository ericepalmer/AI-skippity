import { useState } from 'react'
import type { GameConfig } from '../game/types'

interface SetupScreenProps {
  onStart: (config: GameConfig) => void
}

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2)
  const [aiOpponents, setAiOpponents] = useState(true)

  return (
    <div className="setup-screen">
      <div className="setup-hero">
        <p className="eyebrow">Susan McKinley Ross · MindWare</p>
        <h1 className="brand">Skippity</h1>
        <p className="tagline">
          Jump any skipper. Capture colors. Complete the most rainbow sets.
        </p>
      </div>

      <div className="setup-controls">
        <fieldset>
          <legend>Players</legend>
          <div className="choice-row">
            {([2, 3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                className={playerCount === n ? 'choice selected' : 'choice'}
                onClick={() => setPlayerCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={aiOpponents}
            onChange={(e) => setAiOpponents(e.target.checked)}
          />
          <span>Play against AI opponents</span>
        </label>

        <button
          type="button"
          className="primary-btn"
          onClick={() => onStart({ playerCount, aiOpponents })}
        >
          Deal the board
        </button>
      </div>

      <details className="rules">
        <summary>How to play</summary>
        <ol>
          <li>
            The 10×10 board fills with 100 skippers (20 of each of 5 colors). The
            four center spaces start empty.
          </li>
          <li>
            On your turn, jump <em>any</em> skipper orthogonally over an adjacent
            skipper onto an empty square (like checkers, but not diagonal).
          </li>
          <li>
            Captured skippers go to your score by color. Chain jumps if you
            want—you may stop early.
          </li>
          <li>
            When no jumps remain, most complete sets of all five colors wins.
            Tiebreak: most skippers captured.
          </li>
        </ol>
      </details>
    </div>
  )
}
