# CLOB WebSocket research record

## Source catalog

Retrieved on 2026-10-06 after source approval. Each entry has a full immutable HTML counterpart in `raw/html/` and full Markdown content in `raw/md/`. The specification is JSON enclosed without alteration in Markdown and generated HTML. SDK source files are enclosed in TypeScript fences, with GitHub HTML retained separately. The blog's original HTML shell and complete JavaScript bundle are retained, alongside the extracted complete article.

| Source | Upstream | Markdown archive |
| --- | --- | --- |
| Polymarket Real-Time Data | [Documentation](https://docs.polymarket.com/market-data/realtime-data) | [Archive](../raw/md/polymarket-realtime-data-2026.md) |
| Polymarket CLOB AsyncAPI | [Specification](https://docs.polymarket.com/asyncapi.json) | [Archive](../raw/md/polymarket-clob-asyncapi-2026.md) |
| SDK market manager | [Pinned source](https://github.com/Polymarket/ts-sdk/blob/d36b9df37b8562887aadad78b063bb84550eb343/packages/client/src/websockets/clob/market.ts) | [Archive](../raw/md/polymarket-sdk-websocket-clob-market-2026.md) |
| SDK subscription protocol | [Pinned source](https://github.com/Polymarket/ts-sdk/blob/d36b9df37b8562887aadad78b063bb84550eb343/packages/client/src/websockets/clob/protocol.ts) | [Archive](../raw/md/polymarket-sdk-websocket-clob-protocol-2026.md) |
| SDK heartbeats | [Pinned source](https://github.com/Polymarket/ts-sdk/blob/d36b9df37b8562887aadad78b063bb84550eb343/packages/client/src/websockets/heartbeat.ts) | [Archive](../raw/md/polymarket-sdk-websocket-heartbeat-2026.md) |
| SDK connection lifecycle | [Pinned source](https://github.com/Polymarket/ts-sdk/blob/d36b9df37b8562887aadad78b063bb84550eb343/packages/client/src/websockets/lifecycle.ts) | [Archive](../raw/md/polymarket-sdk-websocket-lifecycle-2026.md) |
| Arbitrage Exists Between Kalshi and Polymarket but You Can't Exploit It | [Blog](https://www.zhinit.dev/blog/kalshi-polymarket-arbitrage) | [Archive](../raw/md/zhinit-kalshi-polymarket-arbitrage-2026.md) |

Original source hashes and retrieval metadata are in [clob-websocket-source-catalog.json](clob-websocket-source-catalog.json). The [source retrieval record](../raw/source_retrieval/2026-10-06-clob-websocket/README.md) documents formats and reproducible blog extraction. The [live probe archive](../raw/poking_around_api/2026-10-06-clob-websocket/README.md) contains the exact successful browser scripts, full captures, requests, offline analysis, and test limitations.

## Assessment comparison

The [assignment](../Engineering_Take_Home_Assignment_-_Front_End.md) describes snapshots followed by per-asset deltas, including snapshot seeds for last trade and tick size. The [cited protocol findings](../wiki/polymarket-clob-websocket.md) support those requirements for the observed NFL messages. They also record the published book schema's missing seed fields and the optional status of delta best-quote fields in that schema. The assignment's detailed requirements remain in the assignment.

The blog's general statement that every Polymarket message carries a complete book conflicts with the current documented feed and captured deltas. Its historical collection scope does not establish which message types its collector saved. The comparison does not audit that collector or its historical dataset. The exact discrepancy and source citations are recorded in the wiki topic page.

## Verification scope

The live record covers two NFL games, same-socket subscription switching, application heartbeat replies, suppression of initial snapshots, and fresh snapshots following a deliberate clean-close reconnect. It includes old-token messages received shortly after switching. Trade and tick-size change events did not arrive. Automatic recovery after a network outage and the server's no-heartbeat timeout were not established. These limits remain explicit in the cited wiki and raw evidence.
