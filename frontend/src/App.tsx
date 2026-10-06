import { useEffect, useRef, useState } from 'react'
import { fetchGames } from './api/gamma'
import { MarketStream } from './api/marketStream'
import { GameSelector } from './components/GameSelector'
import { gameDate } from './dates'
import { MarketTable } from './components/MarketTable'
import { ConnectionNotice, ConnectionStatus } from './components/ConnectionStatus'
import type { Game } from './types'

type Discovery = { games: Game[] } & (
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' }
)

export default function App() {
  const [discovery, setDiscovery] = useState<Discovery>({ status: 'loading', games: [] })
  const [selectedId, setSelectedId] = useState('')
  const [attempt, setAttempt] = useState(0)
  const stream = useRef<MarketStream | null>(null)
  const games = discovery.games
  const selectedGame = games.find((game) => game.id === selectedId) ?? games[0]

  useEffect(() => {
    const controller = new AbortController()
    void fetchGames(controller.signal, (loaded) => {
      if (controller.signal.aborted) return
      setDiscovery({ status: 'loading', games: loaded })
      setSelectedId((current) => current || loaded[0]?.id || '')
    })
      .then((loaded) => {
        if (!controller.signal.aborted) setDiscovery({ status: 'ready', games: loaded })
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setDiscovery((current) => ({
            status: 'error',
            games: current.games,
            message:
              error instanceof Error
                ? error.message
                : 'Unable to load games. Check your connection and try again.',
          }))
      })
    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    const connection = new MarketStream()
    stream.current = connection
    return () => {
      connection.dispose()
      stream.current = null
    }
  }, [])

  useEffect(() => {
    stream.current?.setAssets(
      selectedGame?.markets.flatMap((market) =>
        market.outcomes.map((outcome) => outcome.assetId),
      ) ?? [],
    )
  }, [selectedGame])

  function retry() {
    setDiscovery({ status: 'loading', games: [] })
    setSelectedId('')
    setAttempt((value) => value + 1)
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to markets
      </a>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Rothera home">
          <img src="/rothera-logo.png" alt="ROTHERA" />
        </a>
      </header>
      <div className="workspace">
        {games.length > 0 && (
          <GameSelector
            games={games}
            selectedId={selectedGame?.id ?? ''}
            onSelect={setSelectedId}
          />
        )}
        <main id="main" className={games.length ? '' : 'full-width'}>
          {discovery.status === 'loading' && games.length === 0 && (
            <div className="state-panel" role="status">
              <div className="loader" />
              <h2>Finding the next matchup</h2>
              <p>Loading the full slate of active NFL games…</p>
            </div>
          )}
          {discovery.status === 'error' && games.length === 0 && (
            <div className="state-panel" role="alert">
              <span className="state-symbol">!</span>
              <h2>Games couldn’t load</h2>
              <p>{discovery.message}</p>
              <button className="primary-button" onClick={retry}>
                Try again
              </button>
            </div>
          )}
          {discovery.status === 'ready' && games.length === 0 && (
            <div className="state-panel">
              <span className="state-symbol">↗</span>
              <h2>No active games right now</h2>
              <p>Open NFL game winner and over/under markets will appear here when available.</p>
              <button className="primary-button" onClick={retry}>
                Check again
              </button>
            </div>
          )}
          {selectedGame && (
            <>
              {discovery.status === 'loading' && (
                <p className="discovery-notice" role="status">
                  {games.length} games found · Loading remaining games…
                </p>
              )}
              {discovery.status === 'error' && (
                <div className="connection-notice" role="alert">
                  <p>The game list is incomplete. {discovery.message}</p>
                  <button className="primary-button" onClick={retry}>
                    Try again
                  </button>
                </div>
              )}
              <h1 className="feed-heading">
                <ConnectionStatus />
              </h1>
              <section className="matchup" aria-label="Selected game">
                <div className="matchup-top">
                  <h2>{selectedGame.title}</h2>
                  <a
                    href={`https://polymarket.com/event/${selectedGame.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on Polymarket <span aria-hidden="true">↗</span>
                  </a>
                </div>
                <div className="matchup-bottom">
                  <p>
                    {selectedGame.live && <span className="live-label">● In play · </span>}
                    {gameDate(selectedGame, true)}
                  </p>
                  <span>
                    {selectedGame.markets.length} markets <b>·</b>{' '}
                    {selectedGame.markets.reduce(
                      (count, market) => count + market.outcomes.length,
                      0,
                    )}{' '}
                    outcomes
                  </span>
                </div>
              </section>
              <ConnectionNotice />
              <MarketTable key={selectedGame.id} game={selectedGame} />
              <footer className="main-footer">
                <span>
                  Data is from polymarket API and updates automatically. Times are shown in your
                  local timezone.
                </span>
              </footer>
            </>
          )}
        </main>
      </div>
    </>
  )
}
