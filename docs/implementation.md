# Dashboard implementation

The application lives in `frontend/`. Run and verification commands are in the
[README](../README.md). No API keys, database, or API proxy are used.

## Discovery and scope

`api/gamma.ts` requests Gamma's offset endpoint in 100-event pages until a short
page arrives. It does not stop on a full page with no matching games. It
deduplicates games by ID, filters the assignment's exact game slug pattern,
and excludes ended or closed games.

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

- Prettier formatting check: passed. Generated output and dependencies are excluded.
- ESLint with type-aware recommended rules and React Hooks rules: zero warnings
  or errors. TypeScript strict check: passed.
- 28 tests across six files: passed. Covers pagination, scope, token validation,
  all four wire event types, missing prices, non-power-of-ten ticks, spread,
  immutable updates, same-socket switching, stale callbacks, heartbeat timeout,
  reconnect/backoff, incomplete snapshot deadlines and recovery, teardown,
  repeated flashes, UI states, and StrictMode cleanup.
- A React Profiler test verified that a bid update commits its cell without
  committing the unchanged ask or another token's cell, or invoking the table
  parent again. This is a controlled render-isolation test, not a production
  performance benchmark.
- Production build: passed. JavaScript 238.54 kB (74.80 kB gzip), CSS 12.75 kB
  (3.17 kB gzip) for this build.
- Live headless Chrome: 43 active games, six Gamma pages, and all 86 outcome
  snapshots for Buccaneers versus Cowboys. Game switching reused one socket.
  A forced clean close created one replacement socket and restored current
  snapshots. Literal PING and PONG were observed. No browser runtime exceptions.
- Desktop 1440 × 1100 and mobile 390 × 844 screenshots were visually inspected.
  Both layouts fit the viewport. Mobile selection and table scrolling worked.
  The final smoke run asserted that the desktop stylesheet was applied, the
  dark background matched the reference palette, and market descriptions used 12 px text.

The initial browser run observed 95 price-change messages. The final run was
quiet and observed no deltas during its short window. Neither run observed a
trade or tick-size change, so those paths were verified with deterministic
tests. Flash cancellation, direction, and 500 ms timing options were tested with
a mocked animation API. Exact wall-clock fade duration was not measured.

The reproducible live check is `frontend/scripts/browser-smoke.mjs`. It prints
the temporary directory containing its JSON report and screenshots. The current
run's report is also preserved as [browser-smoke-result.json](browser-smoke-result.json).

## Limits

Events are discovered at page load or on retry. Reload to discover newly listed
games. Endpoint availability and market activity depend on Polymarket. Like the
research, this implementation cannot identify an old frame received after a
rapid A → B → A switch when the wire frame has no subscription-generation ID.
Google Fonts supplies optional typefaces, with local sans-serif and monospace
fallbacks. No production hosting has been configured.
