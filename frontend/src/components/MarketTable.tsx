import { memo } from 'react'
import type { Game, Market } from '../types'
import { PriceCell } from './PriceCell'

const MarketRows = memo(function MarketRows({ market }: { market: Market }) {
  return market.outcomes.map((outcome, index) => (
    <tr key={outcome.assetId} className={index === 0 ? 'market-start' : ''} data-asset-id={outcome.assetId}>
      <th scope="row">
        <span className={`outcome-icon ${market.kind === 'total' ? 'total-icon' : ''}`} aria-hidden="true">
          {market.kind === 'moneyline' ? outcome.label.slice(0, 2).toUpperCase() : outcome.label === 'Over' ? '↗' : '↘'}
        </span>
        <span className="outcome-copy">
          <span className="outcome-name">{outcome.label}{market.line !== null ? ` ${market.line}` : ''}</span>
          <span className="market-question">{market.question}</span>
        </span>
      </th>
      <PriceCell assetId={outcome.assetId} field="bid" />
      <PriceCell assetId={outcome.assetId} field="ask" />
      <PriceCell assetId={outcome.assetId} field="last" />
      <PriceCell assetId={outcome.assetId} field="spread" />
    </tr>
  ))
})

export const MarketTable = memo(function MarketTable({ game }: { game: Game }) {
  const moneyline = game.markets.filter((market) => market.kind === 'moneyline')
  const totals = game.markets.filter((market) => market.kind === 'total')
  return (
    <section className="market-panel" aria-label="Live market prices">
      <div className="panel-heading">
        <div><h2>Market prices</h2><p>Moneyline & all full-game totals</p></div>
        <span className="unit-label">Prices in USD</span>
      </div>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Market prices, scroll to see all columns">
        <table>
          <caption className="sr-only">{game.title}: prices for every moneyline and full-game total outcome</caption>
          <thead><tr>
            <th scope="col">Outcome</th><th scope="col">Best bid</th><th scope="col">Best ask</th>
            <th scope="col">Last traded</th><th scope="col">Spread</th>
          </tr></thead>
          <tbody>
            <tr className="section-row"><th colSpan={5} scope="colgroup">Game outcome <span>Moneyline</span></th></tr>
            {moneyline.length ? moneyline.map((market) => <MarketRows key={market.id} market={market} />)
              : <tr><td colSpan={5} className="empty-market">No open moneyline market.</td></tr>}
            <tr className="section-row"><th colSpan={5} scope="colgroup">Total points <span>{totals.length} lines · Full game</span></th></tr>
            {totals.length ? totals.map((market) => <MarketRows key={market.id} market={market} />)
              : <tr><td colSpan={5} className="empty-market">No open full-game totals.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="table-footer"><span>— Price unavailable</span><span><i className="legend-up" /> Increase <i className="legend-down" /> Decrease</span></div>
    </section>
  )
})
