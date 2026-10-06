import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MarketStream } from './marketStream'
import { useMarketStore } from '../store/marketStore'

class FakeSocket {
  static OPEN = 1
  static instances: FakeSocket[] = []
  readyState = 0
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  send = vi.fn<(data: string) => void>()
  constructor() {
    FakeSocket.instances.push(this)
  }
  open() {
    this.readyState = 1
    this.onopen?.()
  }
  close() {
    this.readyState = 3
    this.onclose?.()
  }
  receive(data: unknown) {
    this.onmessage?.({ data: typeof data === 'string' ? data : JSON.stringify(data) })
  }
}

function socket(index = 0): FakeSocket {
  const result = FakeSocket.instances[index]
  if (!result) throw new Error('Expected socket was not created')
  return result
}

let stream: MarketStream
beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  FakeSocket.instances = []
  vi.stubGlobal('WebSocket', FakeSocket)
  stream = new MarketStream()
})
afterEach(() => {
  stream.dispose()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('market connection', () => {
  it('subscribes to the latest selection on open and switches on the same socket', () => {
    stream.setAssets(['a'])
    stream.setAssets(['b', 'c'])
    socket().open()
    expect(socket().send).toHaveBeenLastCalledWith(
      JSON.stringify({ type: 'market', assets_ids: ['b', 'c'], initial_dump: true }),
    )
    stream.setAssets(['d'])
    expect(socket().send.mock.calls.slice(-2)).toEqual([
      [JSON.stringify({ operation: 'unsubscribe', assets_ids: ['b', 'c'] })],
      [JSON.stringify({ operation: 'subscribe', assets_ids: ['d'], initial_dump: true })],
    ])
    socket().receive({
      event_type: 'price_change',
      price_changes: [
        { asset_id: 'b', best_bid: '0.5' },
        { asset_id: 'd', best_bid: '0.7' },
      ],
    })
    expect(useMarketStore.getState().quotes.b).toBeUndefined()
    expect(useMarketStore.getState().quotes.d?.bid).toBe(0.7)
    expect(FakeSocket.instances).toHaveLength(1)
  })

  it('sends literal PING every ten seconds and reconnects if PONG stops', () => {
    stream.setAssets(['a'])
    socket().open()
    socket().receive({ event_type: 'book', asset_id: 'a', bids: [], asks: [] })
    vi.advanceTimersByTime(10_000)
    expect(socket().send).toHaveBeenLastCalledWith('PING')
    socket().receive('PONG')
    vi.advanceTimersByTime(10_000)
    expect(socket().send.mock.calls.filter(([message]) => message === 'PING')).toHaveLength(2)
    vi.advanceTimersByTime(30_000)
    expect(useMarketStore.getState().status).toBe('reconnecting')
    vi.advanceTimersByTime(1_000)
    expect(FakeSocket.instances).toHaveLength(2)
  })

  it('clears stale data and reconnects with the current assets and new snapshots', () => {
    stream.setAssets(['a'])
    const original = socket()
    original.open()
    original.receive({ event_type: 'book', asset_id: 'a', bids: [{ price: '0.2' }], asks: [] })
    original.close()
    expect(useMarketStore.getState().quotes.a?.bid).toBeNull()
    stream.setAssets(['b'])
    vi.advanceTimersByTime(1_000)
    socket(1).open()
    expect(socket(1).send).toHaveBeenLastCalledWith(
      JSON.stringify({ type: 'market', assets_ids: ['b'], initial_dump: true }),
    )
    original.receive({
      event_type: 'price_change',
      price_changes: [{ asset_id: 'b', best_bid: '0.9' }],
    })
    expect(useMarketStore.getState().quotes.b?.bid).toBeNull()
    socket(1).receive({ event_type: 'book', asset_id: 'b', bids: [{ price: '0.3' }], asks: [] })
    expect(useMarketStore.getState().quotes.b?.bid).toBe(0.3)
  })

  it('cancels timers and rejects callbacks after disposal, including before open', () => {
    stream.setAssets(['a'])
    stream.dispose()
    socket().open()
    socket().receive({
      event_type: 'price_change',
      price_changes: [{ asset_id: 'a', best_bid: '0.4' }],
    })
    vi.advanceTimersByTime(100_000)
    expect(FakeSocket.instances).toHaveLength(1)
    expect(socket().send).not.toHaveBeenCalled()
    expect(useMarketStore.getState().quotes).toEqual({})
    expect(vi.getTimerCount()).toBe(0)
  })

  it('backs off across failed reconnects and times out stalled connection attempts', () => {
    stream.setAssets(['a'])
    vi.advanceTimersByTime(15_000)
    expect(useMarketStore.getState().status).toBe('reconnecting')
    vi.advanceTimersByTime(1_000)
    socket(1).close()
    vi.advanceTimersByTime(1_999)
    expect(FakeSocket.instances).toHaveLength(2)
    vi.advanceTimersByTime(1)
    expect(FakeSocket.instances).toHaveLength(3)
    stream.dispose()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('recovers from a partial snapshot even when heartbeats and deltas arrive', () => {
    stream.setAssets(['a', 'b'])
    socket().open()
    socket().receive({ event_type: 'book', asset_id: 'a', bids: [{ price: '0.4' }], asks: [] })
    socket().receive({
      event_type: 'price_change',
      price_changes: [{ asset_id: 'b', best_bid: '0.5' }],
    })
    vi.advanceTimersByTime(10_000)
    socket().receive('PONG')
    vi.advanceTimersByTime(5_000)
    expect(useMarketStore.getState().status).toBe('reconnecting')
    expect(useMarketStore.getState().quotes.a?.bid).toBeNull()
    vi.advanceTimersByTime(1_000)
    socket(1).open()
    expect(socket(1).send).toHaveBeenLastCalledWith(
      JSON.stringify({ type: 'market', assets_ids: ['a', 'b'], initial_dump: true }),
    )
    socket(1).receive([
      { event_type: 'book', asset_id: 'a', bids: [], asks: [] },
      { event_type: 'book', asset_id: 'b', bids: [], asks: [] },
    ])
    vi.advanceTimersByTime(10_000)
    socket(1).receive('PONG')
    vi.advanceTimersByTime(5_000)
    expect(useMarketStore.getState().status).toBe('connected')
    expect(Object.values(useMarketStore.getState().quotes).every((quote) => quote.seeded)).toBe(
      true,
    )
    expect(FakeSocket.instances).toHaveLength(2)
  })

  it('backs off repeated snapshot failures instead of resetting on PONG', () => {
    stream.setAssets(['a'])
    socket().open()
    socket().receive('PONG')
    vi.advanceTimersByTime(16_000)
    socket(1).open()
    socket(1).receive('PONG')
    vi.advanceTimersByTime(16_999)
    expect(FakeSocket.instances).toHaveLength(2)
    vi.advanceTimersByTime(1)
    expect(FakeSocket.instances).toHaveLength(3)
  })

  it('restarts the snapshot deadline on selection and ignores old asset snapshots', () => {
    stream.setAssets(['a'])
    socket().open()
    vi.advanceTimersByTime(10_000)
    stream.setAssets(['b'])
    socket().receive({ event_type: 'book', asset_id: 'a', bids: [], asks: [] })
    vi.advanceTimersByTime(5_000)
    expect(useMarketStore.getState().status).toBe('connected')
    expect(FakeSocket.instances).toHaveLength(1)
    vi.advanceTimersByTime(10_000)
    expect(useMarketStore.getState().status).toBe('reconnecting')
  })

  it('cancels a pending snapshot deadline on disposal or an empty selection', () => {
    stream.setAssets(['a'])
    socket().open()
    stream.setAssets([])
    vi.advanceTimersByTime(15_000)
    expect(socket().readyState).toBe(FakeSocket.OPEN)
    stream.setAssets(['b'])
    stream.dispose()
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(30_000)
    expect(FakeSocket.instances).toHaveLength(1)
  })
})
