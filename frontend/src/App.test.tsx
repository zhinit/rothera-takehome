import { StrictMode } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import games from './test/games.json'
import { book, FakeSocket, socket } from './test/FakeSocket'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.useFakeTimers()
  FakeSocket.instances = []
  fetchMock
    .mockReset()
    .mockImplementation(() => Promise.resolve(new Response(JSON.stringify(games))))
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('WebSocket', FakeSocket)
})
afterEach(() => vi.useRealTimers())

async function mount(strict = false) {
  const view = render(
    strict ? (
      <StrictMode>
        <App />
      </StrictMode>
    ) : (
      <App />
    ),
  )
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0)
  })
  return view
}

function prices(outcome: string) {
  const row = screen.getByRole('rowheader', { name: outcome }).closest('tr')
  if (!row) throw new Error(`Missing outcome row: ${outcome}`)
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent)
}

async function feed(...messages: unknown[]) {
  await act(() => {
    socket().receive(messages)
    return Promise.resolve()
  })
}

async function connect() {
  await act(() => {
    socket().open()
    return Promise.resolve()
  })
}

async function seed() {
  await feed(...['101', '102', '103', '104'].map((id) => book(id)))
}

function selectSecondGame() {
  fireEvent.change(screen.getByRole('combobox', { name: 'Select a game' }), {
    target: { value: '2' },
  })
}

function fullPage(...events: unknown[]) {
  return new Response(
    JSON.stringify([
      ...events,
      ...Array.from({ length: 100 - events.length }, (_, id) => ({ id, slug: 'future' })),
    ]),
  )
}

describe('dashboard behavior through HTTP and WebSocket boundaries', () => {
  it('streams before discovery completes and preserves automatic and user selection across pages', async () => {
    let secondPage: (response: Response) => void = () => undefined
    let lastPage: (response: Response) => void = () => undefined
    fetchMock
      .mockResolvedValueOnce(fullPage(games[0]))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            secondPage = resolve
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            lastPage = resolve
          }),
      )
    await mount()
    expect(screen.queryByText('Finding the next matchup')).not.toBeInTheDocument()
    expect(screen.getByText(/Loading remaining games/)).toBeInTheDocument()
    await connect()
    await seed()
    expect(screen.getByText('Live Feed for Selected Matchup')).toBeInTheDocument()

    await act(() => {
      secondPage(fullPage(games[0], { ...games[1], startTime: '2020-01-01T00:00:00Z' }))
      return Promise.resolve()
    })
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Bills at Rams')
    expect(screen.getByRole('heading', { name: 'Chiefs at Dolphins' })).toBeInTheDocument()
    expect(prices('Chiefs')).toEqual(['0.40', '0.50', '0.45', '0.10'])
    expect(socket().send).toHaveBeenCalledTimes(1)

    selectSecondGame()
    await feed(book('201'), book('202'))
    const sentBeforeCompletion = socket().send.mock.calls.length
    await act(() => {
      lastPage(new Response(JSON.stringify([{ ...games[0], live: true }, games[1]])))
      return Promise.resolve()
    })
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Chiefs at Dolphins')
    expect(screen.getByRole('heading', { name: 'Bills at Rams' })).toBeInTheDocument()
    expect(screen.queryByText(/Loading remaining games/)).not.toBeInTheDocument()
    expect(prices('Bills')).toEqual(['0.40', '0.50', '0.45', '0.10'])
    expect(socket().send).toHaveBeenCalledTimes(sentBeforeCompletion)
    expect(FakeSocket.instances).toHaveLength(1)
  })

  it('keeps partial games and live prices available after a later page fails, then retries', async () => {
    let failPage: (response: Response) => void = () => undefined
    fetchMock.mockResolvedValueOnce(fullPage(games[0])).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          failPage = resolve
        }),
    )
    await mount()
    await connect()
    await seed()
    await act(() => {
      failPage(new Response('', { status: 502 }))
      return Promise.resolve()
    })
    expect(screen.getByRole('alert')).toHaveTextContent('The game list is incomplete.')
    expect(screen.getByRole('alert')).toHaveTextContent('502')
    expect(prices('Chiefs')).toEqual(['0.40', '0.50', '0.45', '0.10'])
    expect(screen.getByText('Live Feed for Selected Matchup')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('waits for the terminal page before announcing an empty slate', async () => {
    let finish: (response: Response) => void = () => undefined
    fetchMock.mockResolvedValueOnce(fullPage()).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    await mount()
    expect(screen.getByText('Finding the next matchup')).toBeInTheDocument()
    expect(screen.queryByText('No active games right now')).not.toBeInTheDocument()
    await act(() => {
      finish(new Response('[]'))
      return Promise.resolve()
    })
    expect(screen.getByText('No active games right now')).toBeInTheDocument()
  })

  it('shows loading, an empty result, and games after checking again', async () => {
    let respond: (response: Response) => void = () => undefined
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          respond = resolve
        }),
    )
    render(<App />)
    expect(screen.getByText('Finding the next matchup')).toBeInTheDocument()
    await act(() => {
      respond(new Response('[]'))
      return Promise.resolve()
    })
    expect(screen.getByText('No active games right now')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Check again' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.getByRole('heading', { name: 'Chiefs at Dolphins' })).toBeInTheDocument()
    expect(screen.getByRole('table')).toHaveAccessibleName(/Chiefs at Dolphins/)
    expect(screen.getByRole('option', { name: /Chiefs at Dolphins/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Chiefs at Dolphins/ })).toBeInTheDocument()
    expect(screen.queryByText(/vs\./)).not.toBeInTheDocument()
  })

  it('reports discovery failure and recovers on retry', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }))
    await mount()
    expect(screen.getByRole('alert')).toHaveTextContent('503')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Chiefs' })).toBeInTheDocument()
  })

  it('renders snapshots, deltas, trades, ticks and spreads in their correct outcome rows', async () => {
    await mount()
    expect(screen.getByText('Connecting')).toBeInTheDocument()
    expect(prices('Chiefs')).toEqual(['—', '—', '—', '—'])
    await connect()
    expect(screen.getByText('Syncing 0/4')).toBeInTheDocument()
    await feed(book('101', '0.30', '0.50'))
    expect(screen.getByText('Syncing 1/4')).toBeInTheDocument()
    await feed(book('102'), book('103', '0.60', '0.70'), book('104', '0.20', '0.30'))
    expect(screen.getByText('Live Feed for Selected Matchup')).toBeInTheDocument()
    expect(prices('Over 43.5')).toEqual(['0.60', '0.70', '0.45', '0.10'])
    expect(prices('Under 43.5')).toEqual(['0.20', '0.30', '0.45', '0.10'])
    await feed(
      {
        event_type: 'price_change',
        price_changes: [{ asset_id: '101', price: '0.99', best_bid: '0.40' }],
      },
      { event_type: 'last_trade_price', asset_id: '101', price: '0.453' },
      { event_type: 'tick_size_change', asset_id: '101', new_tick_size: '0.001' },
    )
    expect(prices('Chiefs')).toEqual(['0.400', '0.500', '0.453', '0.100'])
    expect(prices('Dolphins')).toEqual(['0.40', '0.50', '0.45', '0.10'])
    await feed({ event_type: 'tick_size_change', asset_id: '101', new_tick_size: '0.01' })
    expect(prices('Chiefs')).toEqual(['0.40', '0.50', '0.453', '0.10'])
  })

  it('preserves missing fields, clears explicit empty quotes, and displays zero and crossed spreads', async () => {
    await mount()
    await connect()
    await seed()
    await feed({ event_type: 'price_change', price_changes: [{ asset_id: '101', best_bid: '0' }] })
    expect(prices('Chiefs')).toEqual(['0.00', '0.50', '0.45', '0.50'])
    await feed({ event_type: 'price_change', price_changes: [{ asset_id: '101', best_ask: '' }] })
    expect(prices('Chiefs')).toEqual(['0.00', '—', '0.45', '—'])
    await feed({
      event_type: 'price_change',
      price_changes: [{ asset_id: '101', best_bid: '1', best_ask: '1' }],
    })
    expect(prices('Chiefs')).toEqual(['1.00', '1.00', '0.45', '0.00'])
    await feed({
      event_type: 'price_change',
      price_changes: [{ asset_id: '101', best_ask: '0.90' }],
    })
    expect(prices('Chiefs')).toEqual(['1.00', '0.90', '0.45', '-0.10'])
  })

  it('survives malformed frames and applies valid items from mixed batches', async () => {
    await mount()
    await connect()
    await seed()
    await act(() => {
      socket().receive('invalid JSON')
      return Promise.resolve()
    })
    await feed(
      null,
      42,
      { event_type: 'unknown' },
      { event_type: 'book', asset_id: '101', bids: null, asks: [] },
      { event_type: 'last_trade_price', asset_id: '101', price: 'NaN' },
      { event_type: 'tick_size_change', asset_id: '101', new_tick_size: '0' },
      {
        event_type: 'price_change',
        price_changes: [null, {}, { asset_id: '101', best_bid: '0.42' }],
      },
    )
    expect(prices('Chiefs')).toEqual(['0.42', '0.50', '0.45', '0.08'])
    expect(screen.getByText('Live Feed for Selected Matchup')).toBeInTheDocument()
    await feed(book('101', '0.10', '0.20'))
    expect(prices('Chiefs')[0]).toBe('0.42')
  })

  it('switches games while connecting and ignores late prices for the previous game', async () => {
    await mount()
    selectSecondGame()
    await connect()
    await feed(book('101', '0.90'), book('201', '0.20'), book('202', '0.30'))
    expect(screen.queryByRole('rowheader', { name: 'Chiefs' })).not.toBeInTheDocument()
    expect(prices('Bills')).toEqual(['0.20', '0.50', '0.45', '0.30'])
    expect(screen.getByText('Live Feed for Selected Matchup')).toBeInTheDocument()
    expect(screen.getByText('No open over/under markets.')).toBeInTheDocument()
  })

  it('clears displayed prices after disconnect and recovers only for the current game', async () => {
    await mount()
    await connect()
    await seed()
    const oldSocket = socket()
    await act(() => {
      oldSocket.close()
      return Promise.resolve()
    })
    expect(prices('Chiefs')).toEqual(['—', '—', '—', '—'])
    expect(screen.getByText('Reconnecting')).toBeInTheDocument()
    selectSecondGame()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_250)
      socket(1).open()
    })
    expect(screen.getByText('Syncing 0/2')).toBeInTheDocument()
    await act(() => {
      oldSocket.receive(book('201', '0.99'))
      return Promise.resolve()
    })
    expect(prices('Bills')).toEqual(['—', '—', '—', '—'])
    await act(() => {
      socket(1).receive([book('201', '0.60', '0.70'), book('202')])
      return Promise.resolve()
    })
    expect(prices('Bills')).toEqual(['0.60', '0.70', '0.45', '0.10'])
    expect(screen.getByText('Live Feed for Selected Matchup')).toBeInTheDocument()
    expect(screen.queryByText(/Reconnecting automatically/)).not.toBeInTheDocument()
  })

  it('stays syncing for missing snapshots despite deltas and heartbeats, then recovers', async () => {
    await mount()
    await connect()
    await feed(book('101'), book('102'), book('103'), {
      event_type: 'price_change',
      price_changes: [{ asset_id: '104', best_bid: '0.60' }],
    })
    expect(screen.getByText('Syncing 3/4')).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
      socket().receive('PONG')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
    expect(screen.getByText('Reconnecting')).toBeInTheDocument()
    expect(prices('Under 43.5')).toEqual(['—', '—', '—', '—'])
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_250)
      socket(1).open()
      socket(1).receive(['101', '102', '103', '104'].map((id) => book(id)))
    })
    expect(screen.getByText('Live Feed for Selected Matchup')).toBeInTheDocument()
  })

  it('renders a totals-only game without inventing a winner market', async () => {
    const first = games[0]
    if (!first) throw new Error('Missing fixture')
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { ...first, markets: first.markets.filter((market) => market.id === 'total') },
        ]),
      ),
    )
    await mount()
    await connect()
    await feed(book('103'), book('104'))
    expect(screen.getByText('No open game winner market.')).toBeInTheDocument()
    expect(screen.getAllByRole('rowheader')).toHaveLength(2)
    expect(screen.getByText('Live Feed for Selected Matchup')).toBeInTheDocument()
  })

  it('ignores a late discarded discovery response in StrictMode and stops the feed on unmount', async () => {
    let staleResponse: (response: Response) => void = () => undefined
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          staleResponse = resolve
        }),
    )
    const view = await mount(true)
    await act(() => {
      staleResponse(new Response('[]'))
      return Promise.resolve()
    })
    expect(screen.getByRole('heading', { name: 'Chiefs at Dolphins' })).toBeInTheDocument()
    await connect()
    await seed()
    const activeSocket = socket()
    view.unmount()
    expect(activeSocket.readyState).toBe(3)
    await act(async () => {
      activeSocket.receive(book('101'))
      await vi.advanceTimersByTimeAsync(60_000)
    })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(FakeSocket.instances.every((item) => item.readyState === 3)).toBe(true)
  })
})
