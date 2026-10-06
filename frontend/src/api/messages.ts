import { isRecord } from '../types'
import { parsePrice, parseTick } from './prices'

export interface QuoteUpdate {
  assetId: string
  snapshot?: boolean
  bid?: number | null
  ask?: number | null
  last?: number | null
  tick?: number | null
}

function bestPrice(levels: unknown[], side: 'bid' | 'ask'): number | null {
  let best: number | null = null
  for (const level of levels) {
    if (!isRecord(level)) continue
    const price = parsePrice(level.price)
    if (price === null) continue
    if (best === null || (side === 'bid' ? price > best : price < best)) best = price
  }
  return best
}

export function parseMessages(raw: string): QuoteUpdate[] {
  if (raw === 'PONG') return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  const updates: QuoteUpdate[] = []
  const messages: unknown[] = Array.isArray(parsed) ? parsed : [parsed]
  for (const message of messages) {
    if (!isRecord(message)) continue
    if (message.event_type === 'price_change' && Array.isArray(message.price_changes)) {
      for (const item of message.price_changes) {
        if (!isRecord(item) || typeof item.asset_id !== 'string') continue
        const update: QuoteUpdate = { assetId: item.asset_id }
        // Absent fields leave the prior quote intact. Explicit empties clear it.
        if ('best_bid' in item) update.bid = parsePrice(item.best_bid)
        if ('best_ask' in item) update.ask = parsePrice(item.best_ask)
        updates.push(update)
      }
      continue
    }
    if (typeof message.asset_id !== 'string') continue
    if (
      message.event_type === 'book' &&
      Array.isArray(message.bids) &&
      Array.isArray(message.asks)
    ) {
      updates.push({
        assetId: message.asset_id,
        snapshot: true,
        bid: bestPrice(message.bids, 'bid'),
        ask: bestPrice(message.asks, 'ask'),
        last: parsePrice(message.last_trade_price),
        tick: parseTick(message.tick_size),
      })
    } else if (message.event_type === 'last_trade_price') {
      const last = parsePrice(message.price)
      if (last !== null) updates.push({ assetId: message.asset_id, last })
    } else if (message.event_type === 'tick_size_change') {
      const tick = parseTick(message.new_tick_size)
      if (tick !== null) updates.push({ assetId: message.asset_id, tick })
    }
  }
  return updates
}
