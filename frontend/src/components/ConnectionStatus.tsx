import { useShallow } from 'zustand/react/shallow'
import { useMarketStore } from '../store/marketStore'

export function ConnectionStatus() {
  const [status, ready, total] = useMarketStore(
    useShallow((state) => [
      state.status,
      Object.values(state.quotes).filter((quote) => quote.seeded).length,
      Object.keys(state.quotes).length,
    ]),
  )
  const live = status === 'connected' && ready === total && total > 0
  const label = live
    ? 'Live Feed for Selected Matchup'
    : status === 'connected'
      ? `Syncing ${ready}/${total}`
      : status === 'reconnecting'
        ? 'Reconnecting'
        : status === 'connecting'
          ? 'Connecting'
          : 'Feed standby'
  return (
    <span className={`connection-status ${live ? 'is-live' : ''}`} role="status">
      <i />
      {label}
    </span>
  )
}

export function ConnectionNotice() {
  const status = useMarketStore((state) => state.status)
  if (status !== 'reconnecting') return null
  return (
    <p className="connection-notice" role="status">
      The price feed disconnected or did not finish syncing. Reconnecting automatically and fetching
      fresh prices.
    </p>
  )
}
