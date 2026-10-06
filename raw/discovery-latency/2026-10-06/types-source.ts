export interface Outcome {
  assetId: string
  label: string
}

export interface Market {
  id: string
  question: string
  kind: 'moneyline' | 'total'
  line: number | null
  outcomes: Outcome[]
}

export interface Game {
  id: string
  slug: string
  title: string
  startTime: string | null
  live: boolean
  markets: Market[]
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
