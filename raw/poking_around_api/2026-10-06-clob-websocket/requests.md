# Probe requests and execution

## Executed successful command

`node /private/tmp/rothera-clob-probe.mjs`

Execution required headless Chrome outside the sandbox. The script launched Chrome, served a static page on a random localhost port, attached Chrome DevTools Protocol, enabled WebSocket diagnostics, navigated to that page, and awaited `window.probe`. The page made API connections directly.

## REST discovery

The browser fetched `https://gamma-api.polymarket.com/events?tag_slug=nfl&active=true&closed=false&limit=100&offset={offset}` sequentially for offsets 0, 100, 200, 300, 400, and 500. Each response was HTTP 200. The first five pages contained 100 events each and the final page contained 55. Response bodies were not retained. The result contains the page ledger and selected market questions and token IDs.

The page filtered exact game slugs, selected moneyline and exact full-game O/U questions, excluded closed markets, and sorted games by reported 24-hour volume. Game A was `nfl-tb-dal-2026-10-09` and game B was `nfl-bal-atl-2026-10-12`. Each had 43 selected markets and 86 outcome IDs.

## WebSocket sequence

Every connection used `wss://ws-subscriptions-clob.polymarket.com/ws/market`. Exact subscription payloads and their full ID arrays are saved in `probe-result.json`.

1. Open `switch` with game A, `type: "market"`, and `initial_dump: true`. Send literal text `PING` every 10 seconds.
2. Open a parallel `no-heartbeat` connection for game A with `initial_dump: true`. Do not send application heartbeats.
3. Open a parallel `no-initial-dump` connection for game A with `initial_dump: false`. Send `PING` every 10 seconds.
4. After 25 seconds, send `operation: "unsubscribe"` for A and `operation: "subscribe"` for B on `switch`. The update subscription has no `initial_dump` property.
5. After another 25 seconds, unsubscribe B and subscribe A on the same socket.
6. After another 15 seconds, deliberately close `switch` with code 1000. One second later, create `reconnect` and send a full initial subscription for A. Send `PING` every 10 seconds.
7. After 25 seconds, close `reconnect` and `no-initial-dump`. After another 20 seconds, record the no-heartbeat socket's ready state and request its closure.

This run lasted from 2026-10-06T17:27:57.403Z to 2026-10-06T17:29:53.112Z. These intervals use browser wall time and are subject to scheduling delays.

## Initial failed attempt

The first attempt fetched only offset 300 and could not find two matching games on that page. Its returned error was `Error: Need two NFL games on page` and it captured zero WebSocket frames. The corrected script paginated the event set. The initial output file was overwritten by the successful run, and its earlier script version was not retained. This paragraph records the observed failure, rather than presenting a reconstructed script or capture as original evidence.
