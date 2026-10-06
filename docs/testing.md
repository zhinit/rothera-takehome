# Testing

Tests assert observable outputs: parsed data, protocol messages, displayed rows,
prices, connection status, and rendered highlights. HTTP responses and WebSocket
transport are controlled at the browser boundary. Dashboard integration tests
use the application's actual discovery, streaming, parsing, store and components.

## Commands

Run from `frontend/`:

| Command | Purpose |
| --- | --- |
| `npm test` | 64 Vitest unit/integration cases in jsdom, without external API access |
| `npm run test:browser` | Seven repeatable Chrome scenario groups with controlled inputs |
| `npm run test:live` | Optional connectivity smoke against Polymarket |
| `npm run lint` | Type-aware TypeScript lint and browser script lint, zero warnings |
| `npm run typecheck` | Strict TypeScript checking |
| `npm run format:check` | Formatting verification |
| `npm run build` | Production build and TypeScript checking |

Start `npm run dev` before either browser command. Both use installed Chrome and
save screenshots and a JSON report to a printed temporary directory. Override
`CHROME_PATH` or `DEMO_URL` as needed. No browser automation package is required.

## Behavior covered

- Discovery: pagination past nonmatching pages, deduplication, market filtering,
  home/away display names and fallbacks, reversed outcome/token order, malformed
  mappings, later-page failure, cancellation, loading, empty results and retry.
- Progressive discovery: live prices before completion, automatic and user
  selection preserved across reordered pages, duplicate-game metadata without
  resubscription, partial failure with usable prices, terminal-only empty state,
  cancellation during body parsing, and unchanged-token snapshot deadlines.
- Feed to screen: initial books, deltas, trades, tick changes, historical trade
  precision, spread recalculation, zero/one prices, crossed markets, absent versus
  explicitly empty quote fields, malformed frames and mixed batches.
- Recovery: switching while connecting, same-socket subscription changes, stale
  messages, cleared prices during disconnect, partial-snapshot deadlines despite
  heartbeats/deltas, reconnect backoff, fresh snapshots and StrictMode cleanup.
- Browser behavior: visible increase/decrease highlights, repeated increases
  extending the fade, direction reversal during a flash, automatic clearing,
  no flash on initial snapshots or precision-only/unchanged updates, desktop and
  mobile selection, table headings and mobile viewport fit.

A focused React Profiler test verifies that a changed bid cell commits while
unchanged cells and its test table parent do not. This protects the assignment's
render-isolation requirement. It is not a production performance benchmark.
Protocol assertions also remain because heartbeat text and subscription payloads
are external API contracts. Store object identity, exact animation method calls,
exact color values and CSS layout mechanisms are not test contracts.

## Limits

The Chrome behavior suite replaces HTTP and WebSocket boundaries inside the
browser. It exercises app integration and browser rendering, but cannot verify
Polymarket availability, CORS or wire-schema compatibility. The optional live
smoke test covers that connection and requires at least two active games.

Animation assertions inspect computed cell backgrounds and allow scheduling
tolerance around the 500 ms fade. They do not measure exact timing or perform
pixel-based screenshot comparisons. The seven browser groups form one sequential
journey and stop at the first failure. Accessibility checks cover semantic table
headings and controls, not a comprehensive accessibility audit.

Wire messages without a subscription-generation identifier cannot distinguish
an old frame after a rapid A → B → A switch. Tests do not claim to solve that
protocol limitation. No coverage percentage or load benchmark is configured.

## Latest verification

On 2026-10-06, all 64 Vitest cases, seven controlled browser groups, the live
smoke check, lint, TypeScript, formatting, and the production build passed.
Production assets were 238.07 kB JavaScript (74.80 kB gzip) and 10.70 kB CSS
(2.82 kB gzip).

The live check found 43 games and displayed 86 outcome rows for the selected
game. Switching reused the socket, forced disconnection recovered with fresh
snapshots, and PING/PONG and price changes were observed. Desktop and mobile
checks passed with no runtime exceptions. No trade or tick-size messages arrived
during the live run. Controlled tests cover those paths.

The [controlled browser report](browser-behavior-result.json) and
[live smoke report](browser-smoke-result.json) record the verified compact-row
UI and progressive discovery. Their screenshot paths point to temporary local
artifacts that may be cleaned up.
