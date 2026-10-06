# Polymarket direct browser access

## Verification record

On 2026-10-06, headless Google Chrome loaded a static page from `http://127.0.0.1:63904`. The page fetched Gamma's offset-300 NFL events directly, with `credentials: omit`, and received HTTP 200 with 100 events. It then connected directly to `wss://ws-subscriptions-clob.polymarket.com/ws/market`, received HTTP 101, and sent an initial subscription for the two Buccaneers versus Cowboys moneyline tokens. No local server forwarded these API requests. The original script and full Chrome DevTools capture are in [the probe directory](../raw/poking_around_api/2026-10-06/README.md). (source: poking_around_api/2026-10-06/observations.md) (source: poking_around_api/2026-10-06/probe-localhost-result.json)

An earlier curl request supplied `Origin: http://localhost:5173` and received `Access-Control-Allow-Origin: *`. The successful Chrome run provides browser execution evidence beyond that header check. These observations establish access for the tested environment and requests. They do not establish access from every region, origin, browser, or network. (source: poking_around_api/2026-10-06/gamma-events-offset-0.headers.txt) (source: poking_around_api/2026-10-06/observations.md)

## Subscription and received data

The browser sent `assets_ids`, `type: market`, and `initial_dump: true`. The official market-channel reference describes this public subscription and identifies `initial_dump` as the initial snapshot option. The captured response was one JSON array containing two `book` objects, one per subscribed asset. (source: polymarket-market-websocket-2026.md) (source: poking_around_api/2026-10-06/probe-localhost-result.json)

| Outcome | Highest snapshot bid | Lowest snapshot ask | Snapshot tick size | Snapshot last trade |
| --- | ---: | ---: | --- | --- |
| Buccaneers | 0.19 | 0.20 | `0.01` | `0.190` |
| Cowboys | 0.80 | 0.81 | `0.01` | `0.190` |

These values are captured snapshot fields, not current prices. Both messages carried the same `last_trade_price` value. The published book schema documents bids, asks, asset ID, condition ID, timestamp, and hash, but omits the `tick_size` and `last_trade_price` fields present in this capture. This is a documented schema-versus-response difference. (source: poking_around_api/2026-10-06/observations.md) (source: polymarket-market-websocket-2026.md)

## Limits and preliminary failures

The successful probe subscribed only to two moneyline assets. It did not exercise all total-token subscriptions, subscription switching, reconnection, or sustained streaming. The official reference separately documents dynamic `subscribe` and `unsubscribe` operations, literal `PING` every ten seconds, `PONG`, and book, price-change, trade, and tick-size messages. Those capabilities are documented but were not established by this short probe. (source: poking_around_api/2026-10-06/observations.md) (source: polymarket-market-websocket-2026.md)

The preliminary file-origin Chrome probe first dumped the page before its request finished, then returned REST HTTP 200 and a WebSocket error when run with a virtual-time budget. The later localhost run succeeded. The preliminary failure therefore does not demonstrate that direct browser WebSocket access is blocked. Execution failures and the distinction between saved outputs and recorded outcomes are retained in the request record. (source: poking_around_api/2026-10-06/requests.md) (source: poking_around_api/2026-10-06/probe-localhost-result.json)

## Extended WebSocket probe

A second direct-browser run on 2026-10-06 exercised two NFL games, subscription switching, initial dumps, heartbeat replies, and reconnection after a clean close. The [separate probe archive](../raw/poking_around_api/2026-10-06-clob-websocket/README.md) preserves the exact successful scripts, full Chrome capture, offline analyzer and results, execution history, limitations, and hashes. Protocol findings and their evidence are collected in [[polymarket-clob-websocket]]. (source: poking_around_api/2026-10-06-clob-websocket/requests.md) (source: poking_around_api/2026-10-06-clob-websocket/observations.md)

## Related pages

[[polymarket-gamma-pagination]], [[polymarket-nfl-markets]], and [[polymarket-outcome-token-mapping]] describe the discovery data used by the probe.
