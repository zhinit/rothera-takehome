export function parsePrice(value: unknown): number | null {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+(?:\.\d+)?$/.test(value))) return null
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 && price <= 1 ? price : null
}

export function parseTick(value: unknown): number | null {
  const tick = parsePrice(value)
  return tick !== null && tick > 0 && tick < 1 ? tick : null
}

function decimalPlaces(value: number): number {
  const [coefficient = '', exponent = '0'] = String(value).split('e')
  return Math.max(0, (coefficient.split('.')[1]?.length ?? 0) - Number(exponent))
}

export function spread(bid: number | null, ask: number | null): number | null {
  return bid === null || ask === null ? null : Math.round((ask - bid) * 1e8) / 1e8
}

export function formatPrice(value: number | null, tick: number | null, isTrade = false): string {
  if (value === null) return '—'
  const precision = Math.min(8, tick === null ? Math.max(2, decimalPlaces(value)) : decimalPlaces(tick))
  // Historical executions may precede a tick change. Preserve their precision.
  if (isTrade || tick === null) return value.toFixed(Math.min(8, Math.max(precision, decimalPlaces(value))))
  const rounded = Math.round(value / tick) * tick
  return (Object.is(rounded, -0) ? 0 : rounded).toFixed(precision)
}
