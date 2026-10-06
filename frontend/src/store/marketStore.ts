import { create } from 'zustand'
import type { QuoteUpdate } from '../api/messages'

export interface Quote {
  bid: number | null
  ask: number | null
  last: number | null
  tick: number | null
  seeded: boolean
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting'

interface MarketState {
  quotes: Record<string, Quote>
  status: ConnectionStatus
  reset: (assetIds: string[]) => void
  setStatus: (status: ConnectionStatus) => void
  apply: (updates: QuoteUpdate[]) => void
}

export const useMarketStore = create<MarketState>((set) => ({
  quotes: {},
  status: 'idle',
  reset: (assetIds) => set({ quotes: Object.fromEntries(assetIds.map((id) => [id, {
    bid: null, ask: null, last: null, tick: null, seeded: false,
  }])) }),
  setStatus: (status) => set((state) => state.status === status ? state : { status }),
  apply: (updates) => set((state) => {
    let quotes = state.quotes
    for (const update of updates) {
      const previous = quotes[update.assetId]
      // Membership rejects in-flight messages for an unsubscribed game.
      if (!previous || (update.snapshot && previous.seeded)) continue
      const next: Quote = {
        bid: update.bid === undefined ? previous.bid : update.bid,
        ask: update.ask === undefined ? previous.ask : update.ask,
        last: update.last === undefined ? previous.last : update.last,
        tick: update.tick === undefined ? previous.tick : update.tick,
        seeded: previous.seeded || update.snapshot === true,
      }
      if (next.bid === previous.bid && next.ask === previous.ask && next.last === previous.last &&
          next.tick === previous.tick && next.seeded === previous.seeded) continue
      if (quotes === state.quotes) quotes = { ...quotes }
      quotes[update.assetId] = next
    }
    return quotes === state.quotes ? state : { quotes }
  }),
}))
