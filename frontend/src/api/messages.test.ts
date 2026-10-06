import { describe, expect, it } from 'vitest'
import { parseMessages } from './messages'
import { formatPrice, parsePrice, spread } from './prices'

describe('wire prices', () => {
  it('scans unsorted books and seeds the snapshot trade and tick', () => {
    const [quote] = parseMessages(
      JSON.stringify([
        {
          event_type: 'book',
          asset_id: '1',
          bids: [{ price: '.2' }, { price: '0.48' }, { price: '0.3' }],
          asks: [{ price: '0.7' }, { price: '0.51' }, { price: '0.6' }],
          last_trade_price: '0.490',
          tick_size: '0.001',
        },
      ]),
    )
    expect(quote).toEqual({
      assetId: '1',
      snapshot: true,
      bid: 0.48,
      ask: 0.51,
      last: 0.49,
      tick: 0.001,
    })
  })

  it('uses each delta item’s best quotes, never its changed order price', () => {
    expect(
      parseMessages(
        JSON.stringify({
          event_type: 'price_change',
          price_changes: [
            { asset_id: '1', price: '0.1', best_bid: '0.4', best_ask: '0.5' },
            { asset_id: '2', price: '0.9', best_bid: '0.6', best_ask: '' },
            { asset_id: '3', price: '0.3' },
          ],
        }),
      ),
    ).toEqual([
      { assetId: '1', bid: 0.4, ask: 0.5 },
      { assetId: '2', bid: 0.6, ask: null },
      { assetId: '3' },
    ])
  })

  it('preserves zero and one and treats absent prices and empty sides as unknown', () => {
    for (const invalid of ['', ' ', null, undefined, 'NaN', '-0.1', '1.1', {}, false])
      expect(parsePrice(invalid)).toBeNull()
    expect(parsePrice('0')).toBe(0)
    expect(parsePrice('1')).toBe(1)
    expect(
      parseMessages(
        JSON.stringify({
          event_type: 'book',
          asset_id: '1',
          bids: [],
          asks: [],
          last_trade_price: '',
        }),
      ),
    ).toEqual([{ assetId: '1', snapshot: true, bid: null, ask: null, last: null, tick: null }])
  })

  it('handles trades, tick changes, heartbeats, and malformed or unknown frames', () => {
    expect(
      parseMessages(
        JSON.stringify([
          { event_type: 'last_trade_price', asset_id: '1', price: '0.5' },
          { event_type: 'tick_size_change', asset_id: '1', new_tick_size: '0.0025' },
          { event_type: 'last_trade_price', asset_id: '1', price: '' },
        ]),
      ),
    ).toEqual([
      { assetId: '1', last: 0.5 },
      { assetId: '1', tick: 0.0025 },
    ])
    for (const frame of ['PONG', 'broken', 'null', '{}', '[1, null]', '{"event_type":"other"}'])
      expect(parseMessages(frame)).toEqual([])
  })

  it('formats tick increments and spreads without floating-point noise', () => {
    expect(formatPrice(0.503, 0.005)).toBe('0.505')
    expect(formatPrice(0.5025, 0.0025)).toBe('0.5025')
    expect(formatPrice(0.503, 0.01, true)).toBe('0.503')
    expect(formatPrice(spread(0.5, 0.51), 0.01)).toBe('0.01')
    expect(formatPrice(spread(0.5, 0.49), 0.01)).toBe('-0.01')
    expect(formatPrice(spread(0.5, 0.5), 0.01)).toBe('0.00')
    expect(spread(null, 0.51)).toBeNull()
    expect(formatPrice(null, 0.01)).toBe('—')
  })
})
