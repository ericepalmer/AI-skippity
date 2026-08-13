import { useState } from 'react'
import {
  AI_DIFFICULTY_LABELS,
  type AiDifficulty,
  type GameConfig,
} from '../game/types'

interface SetupScreenProps {
  onStart: (config: GameConfig) => void
}

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2)
  const [aiOpponents, setAiOpponents] = useState(true)
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>('medium')

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

        {aiOpponents && (
          <fieldset>
            <legend>AI difficulty</legend>
            <div className="choice-row difficulty-row">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  className={
                    aiDifficulty === level ? 'choice selected' : 'choice'
                  }
                  onClick={() => setAiDifficulty(level)}
                  title={
                    level === 'easy'
                      ? 'Soft plays — most kids can win'
                      : level === 'medium'
                        ? 'Solid play — beatable once you know the game'
                        : 'Denies good replies — you have to earn it'
                  }
                >
                  {AI_DIFFICULTY_LABELS[level]}
                </button>
              ))}
            </div>
            <p className="hint">
              {aiDifficulty === 'easy' &&
                'Makes short, soft jumps — great for kids.'}
              {aiDifficulty === 'medium' &&
                'Chases sets well, with a few mistakes you can exploit.'}
              {aiDifficulty === 'hard' &&
                'Tries hard not to leave you juicy multi-jumps.'}
            </p>
          </fieldset>
        )}

        <button
          type="button"
          className="primary-btn"
          onClick={() =>
            onStart({
              playerCount,
              aiOpponents,
              aiDifficulty,
            })
          }
        >
          Deal the board
        </button>
        <p className="hint start-hint">First player is chosen at random.</p>
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
