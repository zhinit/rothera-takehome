# Dashboard implementation

The React, TypeScript, Vite, and Zustand application lives in `frontend/`.
The browser connects directly to Gamma REST and the CLOB WebSocket. No API keys,
database, or custom proxy are used. See the [README](../README.md) for setup.

## Discovery

`api/gamma.ts` walks 100-event offset pages until a short page arrives, including
pages with no matching games. It deduplicates by event ID and uses the assignment's
exact slug and market-question patterns to select moneyline and every full-game
total. Closed, inactive, ended, or order-book-disabled entries are excluded where
applicable. Outcome labels and CLOB token IDs are validated and paired by array
index. Explicit V2 markets are excluded because their identifiers are outside
the assignment's CLOB contract.

Requests use `order=startTime,id&ascending=true` and publish games after each page,
so prices can stream while the rest of the slate loads. Selection stays stable
as discovery progresses. A later-page failure leaves discovered games usable
and offers a fresh retry. Games are refreshed on page load or retry only.

## Streaming and rendering

`App` owns one `MarketStream` instance and disposes it on unmount. Changing games
unsubscribes the previous tokens, subscribes the new tokens on the same socket,
and clears prior quotes. An unchanged token set preserves the subscription.

The stream sends literal `PING` every ten seconds. Missing heartbeats, failed
connections, or incomplete initial snapshots trigger reconnects with exponential
backoff and fresh snapshots. Connection and snapshot deadlines are 15 seconds.
Disconnected prices are cleared. Unknown tokens and obsolete socket callbacks
cannot update the selected game.

`api/messages.ts` validates input from `unknown`. The first book per token seeds
maximum bid, minimum ask, last trade, and tick size. Later updates use each delta
item's best quotes, trade prices, and tick changes without reconstructing books.

The Zustand store batches each frame and suppresses unchanged values.
`PriceCell` subscribes only to its price and tick through a shallow selector.
The table does not subscribe to streaming quotes. Selector evaluation still
occurs on store notifications, but unchanged cells do not rerender.

## Display

Outcome cells show the team name or Over/Under label and point line.
The selected matchup appears above the table, using away/home metadata when
available. Totals sort numerically. All prices are dollars per share, and missing prices display `—`.
Bid, ask, and spread formatting follows the current tick. Historical trade
precision is preserved after tick changes. Spread is ask minus bid, normalized
to eight decimal places, with zero and negative values retained.

Price changes flash green or red for 500 ms. Each change restarts the animation.
Initial seeds, missing values, and precision-only changes do not flash.
The layout includes semantic tables, keyboard-accessible scrolling, a mobile
game selector, and loading, error, empty, and reconnecting states.

The logo and favicon are local copies of official [ROTHERA](https://www.rothera.io/)
assets. The dark theme uses its navy and blue palette. Google Fonts supplies
optional Lato and JetBrains Mono faces with local fallbacks.

## Verification and limits

See [testing](testing.md) for current results, commands, and coverage limitations.
A frame without a subscription-generation identifier cannot be distinguished
from an old frame after a rapid A → B → A switch. API availability depends on
Polymarket. No production hosting is configured.
