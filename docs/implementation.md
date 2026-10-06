# Dashboard implementation

The application lives in `frontend/`. Run and verification commands are in the
[README](../README.md). No API keys, database, or API proxy are used.

## Discovery and scope

`api/gamma.ts` requests Gamma's offset endpoint in 100-event pages until a short
page arrives. It does not stop on a full page with no matching games. It
deduplicates games by ID, filters the assignment's exact game slug pattern,
and excludes ended or closed games.

Requests use `order=startTime,id&ascending=true` and publish validated games after
each page. The first available game can stream prices while remaining pages load.
The UI preserves selection as the list grows, labels incomplete discovery, and
keeps partial games usable if a later page fails. Retry starts a fresh walk.
An empty slate is announced only after the terminal page. Cancelled walks cannot
publish more progress. Requests remain sequential, with no custom metadata cache.
See the [discovery latency research](discovery-latency-research.md).

Markets must match the event title exactly for moneyline, or the title plus
`: O/U {number}` exactly for totals. Totals sort numerically. Closed, explicitly
inactive, or explicitly order-book-disabled markets are excluded. Both outcome
labels and CLOB token IDs are validated and mapped by their original array index.
Only the assignment's CLOB token representation is supported. Explicit V2
markets are skipped rather than interpreting position IDs as CLOB tokens.

These decisions use the existing research on [pagination](../wiki/polymarket-gamma-pagination.md),
[NFL markets](../wiki/polymarket-nfl-markets.md), and
[token mapping](../wiki/polymarket-outcome-token-mapping.md).

## Streaming and rendering

`App` owns one `MarketStream` instance in an Effect. Game selection changes its
desired token set, sends unsubscribe followed by subscribe on the open socket,
and resets quote state. A pending connection reads the latest selected tokens
when it opens. Unmount closes the socket and clears all timers.
Repeated token sets leave the current quotes, subscription, and snapshot deadline
intact, including when discovery returns a new object for the same game.

The stream sends literal `PING` every ten seconds. More than 30 seconds without
`PONG` closes the connection. Failed attempts use exponential retry delays from
one to 30 seconds plus up to 250 ms jitter. Connection attempts time out after
15 seconds. Disconnection clears displayed prices. Reconnection requests fresh
snapshots for the current selection. There is no replay assumption.

Each subscription has a 15-second deadline for receiving every initial book.
If any are missing, the socket closes and normal reconnect/backoff requests a
fresh snapshot set. Deltas and PONGs do not satisfy the snapshot deadline.
Backoff resets on PONG only after all snapshots arrive. Switching games starts
a new deadline. Completion, disconnection, empty selection, and disposal cancel it.

Messages are validated from `unknown`. Arrays and individual objects are
accepted. The first snapshot per token seeds the numeric maximum bid, minimum
ask, last trade, and tick. Subsequent snapshots for that subscription are
ignored. Price changes use each item's best bid and ask, trades update last
price, and tick messages update formatting. Unknown tokens and obsolete socket
callbacks cannot write into the selected game's quotes.

The normalized Zustand dictionary preserves unaffected records and suppresses
no-op updates. Each `PriceCell` selects its own price and tick with `useShallow`.
The table does not subscribe to the quote dictionary. One feed frame produces
one store update. The readiness badge independently counts seeded outcomes.
Selector checks still run when the store notifies subscribers, so this does not
claim constant-time store notification cost.

See the research on [wire behavior](../wiki/polymarket-clob-websocket.md),
[React lifecycle](../wiki/react-connection-lifecycle.md), and
[Zustand](../wiki/zustand-streaming-state.md).

## Display decisions

- Header logo and favicon are official assets downloaded from [ROTHERA](https://www.rothera.io/):
  [full logo](https://cdn.prod.website-files.com/69a0b2d56634068be7fbbf29/69d2c4704867cb48db6d5fca_Website%20Full%20Logo.png)
  and [favicon](https://cdn.prod.website-files.com/69a0b2d56634068be7fbbf29/69a0b2d56634068be7fbbfa5_Logo_Dark_32x32.png).
  Both are served locally from `frontend/public/`.

- The dark palette adapts ROTHERA's navy `#002549` and bright blue `#2bc1f9`
  from its [official stylesheet](https://cdn.prod.website-files.com/69a0b2d56634068be7fbbf29/css/ledgerx-5e80c6e7301127f96-30c7b84631093.shared.8e03344b5.css).
  Backgrounds use darker navy `#080f1a` and `#0c1828`, with cool white text.
  Best bids retain green `#7daa8e` and best asks retain red `#e3a08a`,
  independently of the brand accent. Lato/JetBrains Mono fonts remain in use.
  Descriptions and headers are at least 12 px, and prices are 14 px.
  Shared CSS variables define the palette.

- Prices are in dollars per share. Empty or unavailable prices display `—`.
  Missing delta fields retain the prior field. Explicit empty best quotes clear
  it. Numeric zero and one are valid values, with no assumed sentinel meaning.
- Bid, ask, and spread use the current tick's grid and decimal precision,
  including non-power-of-ten ticks. Until a tick arrives, supplied precision is
  retained. Trade formatting preserves historical precision after tick changes.
- Spread is ask minus bid, normalized to eight decimal places to remove binary
  floating-point noise. Missing sides produce no spread. Zero and negative
  spreads remain distinguishable.
- Price increases flash green and decreases red. The Web Animations API runs a
  500 ms fade. Each new change cancels the previous animation and starts a fresh
  one, including consecutive changes in the same direction. Initial seeds,
  missing values, and precision-only changes do not flash.
- The game list has a mobile select equivalent. Tables have semantic headers,
  keyboard-accessible scrolling, and horizontal overflow within the table.
  Discovery errors have a retry action. Connection recovery is automatic.

See [price correctness](../wiki/polymarket-price-correctness.md) and
[cell flashes](../wiki/price-cell-flashes.md).

## Verification on 2026-10-06

- Formatting, type-aware ESLint with zero warnings/errors, and strict TypeScript:
  passed. Browser scripts are now included in ESLint.
- 59 unit/integration cases across six files: passed. Dashboard tests exercise
  actual discovery, streaming, parsing, state and components with controlled
  HTTP/WebSocket inputs. Cases cover partial snapshots, stale messages, reconnect
  recovery, malformed batches, quote clearing, pagination failures/cancellation,
  outcome mapping, and StrictMode cleanup.
- Seven controlled Chrome scenario groups: passed. Checks cover discovery retry,
  snapshots, visible flashes and fades, tick/trade/empty-price updates, desktop
  subscription switching, reconnect recovery, and mobile selection/layout.
  The [report](browser-behavior-result.json) records the successful groups and
  the temporary directory containing screenshots.
- A focused React Profiler test verifies that a bid update commits its cell
  without committing the unchanged ask or another token's cell, or invoking its
  test table parent again. This is render-isolation verification, not a production
  performance benchmark.
- Production build: passed. JavaScript 237.38 kB (74.65 kB gzip), CSS 10.63 kB
  (2.80 kB gzip).
- Live headless Chrome: 43 active games, six Gamma pages, and 86 outcome rows
  for Buccaneers at Cowboys. Switching reused one socket. A forced close created
  one replacement socket and restored current snapshots. Literal PING/PONG and
  26 price-change messages were observed. No browser runtime exceptions.
  Desktop and mobile viewport checks passed, as did mobile selection and access
  to the price columns. See the [live report](browser-smoke-result.json).

No trade or tick-size messages arrived during the live check. Controlled tests
exercise both paths. Flash checks inspect rendered background colors, repeated
changes, direction reversal, and eventual clearing. They allow browser scheduling
tolerance around the 500 ms fade rather than measuring an exact duration.
Screenshots are captured for inspection, not compared against visual baselines.

Run `npm test`, `npm run test:browser`, or `npm run test:live` from `frontend/`.
Both browser commands require a running local app and installed Chrome.
See [testing scope and approach](testing.md) for setup and limitations.

## Limits

Events are discovered at page load or on retry. Reload to discover newly listed
games. Endpoint availability and market activity depend on Polymarket. Like the
research, this implementation cannot identify an old frame received after a
rapid A → B → A switch when the wire frame has no subscription-generation ID.
Google Fonts supplies optional typefaces, with local sans-serif and monospace
fallbacks. No production hosting has been configured.
