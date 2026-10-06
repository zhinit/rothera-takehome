import type { Game } from '../types'
import { gameDate } from '../dates'

export function GameSelector({
  games,
  selectedId,
  onSelect,
}: {
  games: Game[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <aside className="game-sidebar" aria-label="Game selection">
      <div className="sidebar-heading">
        <h2>Active NFL markets</h2>
        <span className="count">{games.length}</span>
      </div>
      <div className="mobile-selector">
        <label htmlFor="game-select">Select a game</label>
        <select
          id="game-select"
          value={selectedId}
          onChange={(event) => onSelect(event.target.value)}
        >
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.title} · {gameDate(game)}
            </option>
          ))}
        </select>
      </div>
      <div className="game-list">
        {games.map((game) => (
          <button
            className={`game-option ${game.id === selectedId ? 'selected' : ''}`}
            key={game.id}
            aria-pressed={game.id === selectedId}
            onClick={() => onSelect(game.id)}
          >
            <span className="game-option-date">
              {game.live ? <span className="live-label">● In play</span> : gameDate(game)}
            </span>
            <span className="game-option-title">
              {game.title}
              <span aria-hidden="true">↗</span>
            </span>
            <span className="game-option-markets">{game.markets.length} markets</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
