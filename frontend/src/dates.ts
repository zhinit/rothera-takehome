import type { Game } from './types'

export function gameDate(game: Game, detailed = false): string {
  if (!game.startTime) return 'Kickoff to be announced'
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...(detailed ? { timeZoneName: 'short' } : {}),
  }).format(new Date(game.startTime))
}
