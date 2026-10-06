# Polymarket Gamma pagination

## REST and SDK response shapes

Gamma's `GET /events` accepts `limit`, `offset`, `tag_slug`, `tag_id`, `active`, and `closed`. Its documented response is an array of events with nested `markets`. The offset endpoint has no documented `has_more` response envelope. The newer discovery guide instead demonstrates `/events/keyset` with `next_cursor` and `after_cursor`, and SDK pages with `items` and `hasMore`. These are different response contracts. (source: polymarket-gamma-list-events-2026.md) (source: polymarket-discover-markets-2026.md)

## Observed NFL pagination

On 2026-10-06, requests using `tag_slug=nfl&active=true&closed=false&limit=100` produced the following results. Full response bodies, URLs, hashes, and the analysis script are preserved in [the probe record](../raw/poking_around_api/2026-10-06/README.md). Counts describe this snapshot. (source: poking_around_api/2026-10-06/observations.md)

| Offset | Events | Game-shaped slugs |
| --- | ---: | ---: |
| 0 | 100 | 0 |
| 100 | 100 | 0 |
| 200 | 100 | 0 |
| 300 | 100 | 2 |
| 400 | 100 | 41 |
| 500 | 52 | 1 |
| 600 | 0 | 0 |

The six nonempty pages contained 552 distinct event IDs. A separate request with `limit=500&offset=0` returned 100 entries. This confirms the 100-entry cap for that request. The official offset reference does not specify a maximum for `limit`, so the observed cap is additional evidence rather than a published schema constraint. (source: poking_around_api/2026-10-06/observations.md) (source: polymarket-gamma-list-events-2026.md)

The first three full pages contained no game-shaped slugs. Their contents included futures, entertainment, and season player-stat markets. An absence of matching games on a full page therefore did not indicate the end of the event listing. (source: poking_around_api/2026-10-06/observations.md) (source: polymarket-nfl-events-offset-0-2026.md) (source: polymarket-nfl-events-offset-100-2026.md) (source: polymarket-nfl-events-offset-200-2026.md)

## Related pages

[[polymarket-nfl-markets]] describes game and market identification. [[polymarket-browser-access]] records direct browser access. [[polymarket-discovery-latency]] covers bounded concurrency, ordering, filter coverage comparisons, and progressive completion. [[browser-metadata-caching]] covers browser response reuse and provisional metadata snapshots.
