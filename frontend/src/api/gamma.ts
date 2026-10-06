import { isRecord, type Game, type Market } from '../types'

const GAME_SLUG = /^nfl-[a-z]{2,4}-[a-z]{2,4}-\d{4}-\d{2}-\d{2}$/
const PAGE_SIZE = 100

function stringArray(value: unknown): string[] | null {
  try {
    const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(parsed) && parsed.every((item): item is string => typeof item === 'string')
      ? parsed
      : null
  } catch {
    return null
  }
}

function parseMarket(value: unknown, title: string): Market | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.question !== 'string') return null
  if (value.closed === true || value.active === false || value.enableOrderBook === false) return null
  const prefix = `${title}: O/U `
  const suffix = value.question.startsWith(prefix) ? value.question.slice(prefix.length) : ''
  const moneyline = value.question === title
  if (!moneyline && !/^\d+(?:\.\d+)?$/.test(suffix)) return null

  // This assignment uses CLOB tokens. Do not silently map V2 position IDs to them.
  if (value.version !== undefined && value.version !== 'v1') return null
  const labels = stringArray(value.outcomes)
  const tokens = stringArray(value.clobTokenIds)
  if (!labels || !tokens || labels.length !== 2 || tokens.length !== 2) return null
  if (labels.some((label) => !label.trim()) || tokens.some((token) => !/^\d+$/.test(token))) return null
  if (new Set(tokens).size !== 2) return null

  return {
    id: value.id,
    question: value.question,
    kind: moneyline ? 'moneyline' : 'total',
    line: moneyline ? null : Number(suffix),
    outcomes: tokens.map((assetId, index) => ({ assetId, label: labels[index] ?? '' })),
  }
}

export function parseGame(value: unknown): Game | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.slug !== 'string' ||
      typeof value.title !== 'string' || !Array.isArray(value.markets)) return null
  if (!GAME_SLUG.test(value.slug) || value.ended === true || value.closed === true || value.active === false) return null
  const title = value.title
  const markets = value.markets
    .map((market: unknown) => parseMarket(market, title))
    .filter((market): market is Market => market !== null)
    .sort((a, b) => (a.line ?? -1) - (b.line ?? -1))
  if (markets.length === 0) return null
  const startTime = typeof value.startTime === 'string' && Number.isFinite(Date.parse(value.startTime))
    ? value.startTime : null
  return { id: value.id, slug: value.slug, title, startTime, live: value.live === true, markets }
}

export async function fetchGames(signal: AbortSignal): Promise<Game[]> {
  const games = new Map<string, Game>()
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const params = new URLSearchParams({ tag_slug: 'nfl', active: 'true', closed: 'false', limit: String(PAGE_SIZE), offset: String(offset) })
    const response = await fetch(`https://gamma-api.polymarket.com/events?${params}`, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
      credentials: 'omit',
    })
    if (!response.ok) throw new Error(`Unable to load NFL games (HTTP ${response.status}). Please try again.`)
    const page: unknown = await response.json()
    if (!Array.isArray(page)) throw new Error('The event service returned an unexpected response. Please try again.')
    for (const item of page) {
      const game = parseGame(item)
      if (game) games.set(game.id, game)
    }
    // A full page with no matching games is not the end of the NFL listing.
    if (page.length < PAGE_SIZE) break
  }
  return [...games.values()].sort((a, b) =>
    Number(b.live) - Number(a.live) ||
    (a.startTime ?? '9999').localeCompare(b.startTime ?? '9999') || a.title.localeCompare(b.title),
  )
}
