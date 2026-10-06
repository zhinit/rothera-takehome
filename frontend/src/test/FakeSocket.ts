import { vi } from 'vitest'

// Only the browser transport is replaced. Parsing, subscriptions and state stay real.
export class FakeSocket {
  static OPEN = 1
  static instances: FakeSocket[] = []
  readyState = 0
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  send = vi.fn<(data: string) => void>()
  constructor() {
    FakeSocket.instances.push(this)
  }
  open() {
    this.readyState = FakeSocket.OPEN
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

export function socket(index = 0): FakeSocket {
  const result = FakeSocket.instances[index]
  if (!result) throw new Error('Expected socket was not created')
  return result
}

export function book(assetId: string, bid = '0.40', ask = '0.50') {
  return {
    event_type: 'book',
    asset_id: assetId,
    bids: [{ price: bid }],
    asks: [{ price: ask }],
    last_trade_price: '0.45',
    tick_size: '0.01',
  }
}
