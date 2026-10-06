import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMarketStore } from './marketStore'

beforeEach(() => useMarketStore.getState().reset(['a', 'b']))

describe('quote state', () => {
  it('seeds each token once, applies deltas, trades and ticks, and preserves unrelated records', () => {
    const untouched = useMarketStore.getState().quotes.b
    const apply = useMarketStore.getState().apply
    apply([{ assetId: 'a', snapshot: true, bid: 0.4, ask: 0.5, last: 0.45, tick: 0.01 }])
    apply([
      { assetId: 'a', bid: 0.41 },
      { assetId: 'a', last: 0.42 },
      { assetId: 'a', tick: 0.001 },
    ])
    apply([{ assetId: 'a', snapshot: true, bid: 0.1, last: null }])
    expect(useMarketStore.getState().quotes.a).toEqual({
      bid: 0.41,
      ask: 0.5,
      last: 0.42,
      tick: 0.001,
      seeded: true,
    })
    expect(useMarketStore.getState().quotes.b).toBe(untouched)
  })

  it('ignores unsubscribed assets and identical prices without notifying listeners', () => {
    const state = useMarketStore.getState()
    const listener = vi.fn()
    const unsubscribe = useMarketStore.subscribe(listener)
    state.apply([
      { assetId: 'a', bid: null },
      { assetId: 'old-game', bid: 0.6 },
    ])
    expect(listener).not.toHaveBeenCalled()
    expect(useMarketStore.getState()).toBe(state)
    unsubscribe()
  })

  it('clears old quotes on selection or reconnect and accepts fresh snapshots', () => {
    useMarketStore.getState().apply([{ assetId: 'a', snapshot: true, bid: 0.4 }])
    useMarketStore.getState().reset(['b'])
    useMarketStore.getState().apply([{ assetId: 'a', bid: 0.5 }])
    expect(useMarketStore.getState().quotes.a).toBeUndefined()
    useMarketStore.getState().reset(['a'])
    useMarketStore.getState().apply([{ assetId: 'a', snapshot: true, bid: 0.7 }])
    expect(useMarketStore.getState().quotes.a?.bid).toBe(0.7)
  })
})
