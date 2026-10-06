# Polymarket CLOB WebSocket behavior

## Transport and message envelopes

The public market feed is `wss://ws-subscriptions-clob.polymarket.com/ws/market`. Its initial subscription uses `assets_ids` and `type: "market"`. AsyncAPI documents `initial_dump` as optional with a default of true, `level` as optional with a default of 2, and `custom_feature_enabled` as optional with a default of false. The custom flag enables the additional `best_bid_ask`, `new_market`, and `market_resolved` events. (source: polymarket-clob-asyncapi-2026.md)

The browser probe recorded JSON arrays containing book snapshots, individual JSON objects containing price changes, and literal `PONG` text. The official SDK handles heartbeat messages before JSON parsing and normalizes parsed arrays and objects into individual events. SDK event examples use a `topic`, `type`, and `payload` envelope with camelCase fields. Direct wire messages use `event_type` and snake_case fields at the top level. (source: poking_around_api/2026-10-06-clob-websocket/analysis-result.json) (source: polymarket-sdk-websocket-lifecycle-2026.md) (source: polymarket-sdk-websocket-clob-market-2026.md) (source: polymarket-realtime-data-2026.md)

## Snapshot and delta fields

The following fields are documented by AsyncAPI or observed in the saved direct-browser capture. Snapshot `tick_size` and `last_trade_price` are present in the capture but absent from AsyncAPI's `BookEvent` properties. (source: polymarket-clob-asyncapi-2026.md) (source: poking_around_api/2026-10-06-clob-websocket/analysis-result.json)

| Message | Envelope and payload fields | Evidence |
| --- | --- | --- |
| `book` | `market`, `asset_id`, `timestamp`, `hash`, `bids`, `asks`, `tick_size`, `last_trade_price`, `event_type`. Levels contain string `price` and `size`. | All 430 captured book messages had both seed fields. |
| `price_change` | `market`, `timestamp`, `event_type`, `price_changes[]`. Items contain `asset_id`, `price`, `size`, `side`, `hash`, `best_bid`, `best_ask`. | All 491 captured price-change messages had per-item best quotes. |
| `last_trade_price` | `market`, `asset_id`, `price`, `size`, `side`, `timestamp`, `event_type`, with optional `fee_rate_bps` and `transaction_hash`. | Documented. No execution event arrived in this probe. |
| `tick_size_change` | `market`, `asset_id`, `old_tick_size`, `new_tick_size`, `timestamp`, `event_type`. | Documented. No tick-size event arrived in this probe. |

AsyncAPI defines a price-change item's `price` as the affected order-book level and its `size` as the new aggregate size, with zero indicating removal. `best_bid` and `best_ask` are separate item fields and are not listed as required in that schema. The captured updates include both values for every item. Field presence in this sample does not establish universal availability. (source: polymarket-clob-asyncapi-2026.md) (source: poking_around_api/2026-10-06-clob-websocket/analysis-result.json)

The official specification describes book snapshots on subscription or after a trade, and price-change deltas when orders are placed or cancelled. The captured feed therefore contains both full snapshots and incremental updates. The full-book message format does not describe every message on this feed. The probe observed subscription snapshots and deltas, without observing a trade-triggered snapshot. (source: polymarket-clob-asyncapi-2026.md) (source: poking_around_api/2026-10-06-clob-websocket/probe-result.json)

## Schema and response discrepancy

AsyncAPI's book schema and the direct API example on the current Real-Time Data page omit snapshot `tick_size` and `last_trade_price`. The same page's TypeScript SDK type exposes optional nullable `tickSize` and `lastTradePrice`, and its Python type exposes `tick_size` and `last_trade_price`. Both fields occurred in every captured snapshot. The discrepancy is between the published wire schema/example and observed responses, while the SDK documentation recognizes these values. Absence from the published example does not establish absence from the feed. (source: polymarket-clob-asyncapi-2026.md) (source: polymarket-realtime-data-2026.md) (source: poking_around_api/2026-10-06-clob-websocket/analysis-result.json)

## Blog description discrepancy

The article *Arbitrage Exists Between Kalshi and Polymarket but You Can't Exploit It*, dated 2026-08-06, says in its “Snapshots vs deltas” section: “Polymarket sends the entire book in every message”. Its data collection concerns MLB games from July 30 through August 1, 2026. As a general description of the current CLOB feed, that statement conflicts with the official specification's separate snapshot and delta message types and the 491 captured `price_change` messages. Those delta messages contain changed levels and per-asset best quotes, rather than complete `bids` and `asks` arrays. (source: zhinit-kalshi-polymarket-arbitrage-2026.md) (source: polymarket-clob-asyncapi-2026.md) (source: poking_around_api/2026-10-06-clob-websocket/probe-result.json)

The supported current description is that the feed sends full `book` snapshots and incremental `price_change` updates. The October NFL capture does not establish the July MLB feed's behavior or which event types the article's collector retained. The article's blanket description can be corrected without making a claim about the validity of its historical dataset. (source: polymarket-clob-asyncapi-2026.md) (source: zhinit-kalshi-polymarket-arbitrage-2026.md) (source: poking_around_api/2026-10-06-clob-websocket/requests.md)

## Subscription switching

Official documentation supports `{"operation":"unsubscribe","assets_ids":[...]}` and `{"operation":"subscribe","assets_ids":[...]}` on an existing socket. These operations mutate that connection's asset set. The SDK calculates additions and removals and sends subscription updates, with additions sent before removals in the archived implementation. (source: polymarket-realtime-data-2026.md) (source: polymarket-sdk-websocket-clob-protocol-2026.md)

The probe used the assignment's unsubscribe-then-subscribe order for two NFL games with 86 assets each. Initial subscription, A-to-B switching, and B-to-A switching each returned exactly the requested 86 snapshot IDs. Update subscriptions omitted `initial_dump` and still received fresh snapshots. The separately opened connection with `initial_dump: false` received price changes and no snapshots during the observation window. (source: poking_around_api/2026-10-06-clob-websocket/probe-page.js) (source: poking_around_api/2026-10-06-clob-websocket/analysis-result.json)

Four delta items for removed A tokens arrived in two messages 73 ms after the first switch. The parallel A connection received 66 A delta items during the B interval. This establishes short-lived delivery of removed-token messages after switching in this run. The capture does not establish whether server processing, queued delivery, or timestamp skew caused that timing. No removed B delta items were observed after switching back. (source: poking_around_api/2026-10-06-clob-websocket/probe-result.json) (source: poking_around_api/2026-10-06-clob-websocket/observations.md) (source: poking_around_api/2026-10-06-clob-websocket/analysis-result.json)

## Heartbeats

Official documentation requires an application text frame `PING` every ten seconds and describes a `PONG` text response. The SDK sends this literal text through its raw send path, avoiding JSON serialization, and tracks the last `PONG`. It declares the heartbeat stale after more than 30 seconds without a pong, checks every five seconds, and closes a stale open socket through its usual recovery path. This is a client policy encoded in the SDK, not evidence of the server's disconnect threshold. (source: polymarket-realtime-data-2026.md) (source: polymarket-sdk-websocket-heartbeat-2026.md) (source: polymarket-sdk-websocket-lifecycle-2026.md)

The probe's three heartbeat-enabled connections received 17 `PONG` frames in total. A parallel connection without application heartbeats remained OPEN for 111.347 seconds while receiving market updates. This sample confirms heartbeat replies but does not establish how long a quiet connection without heartbeats survives. (source: poking_around_api/2026-10-06-clob-websocket/analysis-result.json)

## Reconnect behavior and limits

The SDK schedules reconnects while active subscriptions exist, resends the current full asset subscription when a new socket opens, and resets retry backoff on open. Its default retry delay is a uniformly jittered exponential window starting at 250 ms and capped at 30 seconds. Failed attempts schedule another retry. The raw subscription protocol carries an asset set, without a replay cursor in the documented request schemas. These sources do not establish replay of missed updates. (source: polymarket-sdk-websocket-clob-market-2026.md) (source: polymarket-sdk-websocket-lifecycle-2026.md) (source: polymarket-clob-asyncapi-2026.md)

The browser deliberately closed the original socket with code 1000, then opened a new socket and sent a fresh subscription. That connection returned all 86 requested A snapshots and 110 price-change messages. This tests reconnecting and resubscribing after a clean close. Network outages, failed reconnect attempts, automatic retry execution, trade events, tick-size events, and post-trade snapshots were not experimentally verified. Exact scripts, frames, and offline analysis are preserved in the [probe archive](../raw/poking_around_api/2026-10-06-clob-websocket/README.md). (source: poking_around_api/2026-10-06-clob-websocket/requests.md) (source: poking_around_api/2026-10-06-clob-websocket/analysis-result.json)

## Related pages

[[polymarket-price-correctness]] distinguishes field presence from usable trade seeds and records price precision, missing-value behavior, and quote-ordering discrepancies. [[price-cell-flashes]] covers timers and animation continuity for repeated cell changes.

[[react-connection-lifecycle]] covers React ownership, cleanup, and rejecting obsolete connection and subscription work.

[[polymarket-browser-access]] records the direct-browser access checks. [[polymarket-outcome-token-mapping]] explains the identifiers used for subscriptions. [[zustand-streaming-state]] covers state subscription behavior separately from the exchange protocol.
