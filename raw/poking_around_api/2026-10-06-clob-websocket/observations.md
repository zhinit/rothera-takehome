# CLOB WebSocket observations

## Capture conditions

On 2026-10-06, headless Google Chrome ran the archived scripts from `http://127.0.0.1:64635`. The run subscribed to two NFL games with 86 outcome IDs each. It collected 513 received application frames across four labeled connections. The exact messages and Chrome diagnostics are in `probe-result.json`. `analysis-result.json` is derived by the adjacent offline script.

## Observed message fields

All 430 observed `book` messages contained `market`, `asset_id`, `timestamp`, `hash`, `bids`, `asks`, `tick_size`, `event_type`, and `last_trade_price`. Book levels contained price and size strings. This establishes field presence in these captured messages, not a guarantee for every future response or asset.

The 491 `price_change` messages contained `market`, `price_changes`, `timestamp`, and `event_type`. Every observed item contained `asset_id`, `price`, `size`, `side`, `hash`, `best_bid`, and `best_ask`. Changed order-level prices and best quotes were separately available.

Five received frames were JSON arrays and 491 were JSON objects. The remaining 17 were literal `PONG` text frames. The arrays contained book snapshots. A parser that assumes every frame is one JSON object would miss the initial batches, and treating every frame as JSON would fail on `PONG`.

No `last_trade_price` event or `tick_size_change` event arrived during this run. Their event fields cannot be experimentally confirmed by this capture.

## Subscription changes

The `switch` connection received 86 snapshots for A initially, 86 for B after switching, and 86 for A after switching back. The observed snapshot ID sets exactly matched the requested sets. Both update subscribes omitted `initial_dump` and still received snapshots. No socket replacement occurred during the switches.

After the first switch, four price-change items for removed A assets arrived in two messages, both received 73 ms after the switch action. This establishes that removed-asset messages can arrive shortly after a switch in the tested setup. It does not identify whether the cause was server processing, queued delivery, or timestamp skew. The parallel A control connection received 66 A delta items during the B interval. No B delta items were observed on `switch` after switching back to A.

## Heartbeats and initial dump

The `switch`, `no-initial-dump`, and `reconnect` connections sent literal `PING` at 10-second intervals and received 6, 9, and 2 literal `PONG` replies respectively. The no-heartbeat connection remained OPEN after 111.347 seconds and continued receiving market updates. This run did not establish a server timeout for a quiet connection or a connection without heartbeats.

The `initial_dump: false` connection received 155 price-change messages and no book snapshots during its observation window. It received 9 `PONG` replies.

## Reconnect

The original switch connection was intentionally closed cleanly with code 1000. A new connection with a fresh initial subscription for A received all 86 expected snapshots and 110 price-change messages. This tests reconnecting and resubscribing after a deliberate clean close. It does not test automatic retry, failed connection attempts, browser network outages, or replay of missed messages.

## Limits

The scripts recorded Gamma statuses, page counts, selected market questions, and IDs, but did not preserve the Gamma response bodies. This capture supports WebSocket observations and the recorded test setup, rather than a new audit of the complete Gamma dataset. No application was implemented. The initial failed single-page attempt is recorded in `requests.md`, with its missing evidence stated explicitly.
