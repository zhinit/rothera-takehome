import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { fetchGames } from './api/gamma'
import type { Game } from './types'

const connection = vi.hoisted(() => ({ setAssets: vi.fn(), dispose: vi.fn() }))
vi.mock('./api/gamma', () => ({ fetchGames: vi.fn() }))
vi.mock('./api/marketStream', () => ({ MarketStream: class {
  setAssets = connection.setAssets
  dispose = connection.dispose
} }))

const game: Game = { id: '1', slug: 'nfl-kc-mia-2026-09-27', title: 'Chiefs vs. Dolphins',
  startTime: '2026-09-27T17:00:00Z', live: false, markets: [{
    id: 'market', question: 'Chiefs vs. Dolphins', kind: 'moneyline', line: null,
    outcomes: [{ assetId: '1', label: 'Chiefs' }, { assetId: '2', label: 'Dolphins' }],
  }] }

beforeEach(() => {
  vi.mocked(fetchGames).mockReset()
  connection.setAssets.mockClear()
  connection.dispose.mockClear()
})

describe('dashboard states', () => {
  it('shows loading, then an empty slate with a refresh action', async () => {
    let resolveGames: (games: Game[]) => void = () => undefined
    vi.mocked(fetchGames).mockReturnValue(new Promise((resolve) => { resolveGames = resolve }))
    render(<App />)
    expect(screen.getByText('Finding the next matchup')).toBeInTheDocument()
    await act(() => Promise.resolve(resolveGames([])))
    expect(screen.getByText('No active games right now')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check again' })).toBeInTheDocument()
  })

  it('reports a fetch failure and recovers on retry', async () => {
    vi.mocked(fetchGames).mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValueOnce([game])
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: game.title })).toBeInTheDocument()
    await waitFor(() => expect(connection.setAssets).toHaveBeenLastCalledWith(['1', '2']))
  })

  it('changes the selected game and its subscriptions from the selector', async () => {
    const second = { ...game, id: '2', title: 'Bills vs. Rams', markets: [{ ...game.markets[0],
      id: 'second-market', question: 'Bills vs. Rams', kind: 'moneyline' as const, line: null,
      outcomes: [{ assetId: '3', label: 'Bills' }, { assetId: '4', label: 'Rams' }],
    }] }
    vi.mocked(fetchGames).mockResolvedValue([game, second])
    render(<App />)
    await screen.findByRole('heading', { name: game.title })
    fireEvent.change(screen.getByLabelText('Select a game'), { target: { value: '2' } })
    expect(screen.getByRole('heading', { name: second.title })).toBeInTheDocument()
    expect(connection.setAssets).toHaveBeenLastCalledWith(['3', '4'])
    expect(screen.queryByRole('rowheader', { name: /Dolphins/ })).not.toBeInTheDocument()
  })

  it('aborts the discarded StrictMode request and closes the owner on unmount', async () => {
    const signals: AbortSignal[] = []
    vi.mocked(fetchGames).mockImplementation((signal) => { signals.push(signal); return Promise.resolve([game]) })
    const view = render(<StrictMode><App /></StrictMode>)
    await waitFor(() => expect(screen.getByRole('heading', { name: game.title })).toBeInTheDocument())
    expect(signals).toHaveLength(2)
    expect(signals[0]?.aborted).toBe(true)
    expect(signals[1]?.aborted).toBe(false)
    view.unmount()
    expect(signals[1]?.aborted).toBe(true)
    expect(connection.dispose).toHaveBeenCalledTimes(2)
  })
})
