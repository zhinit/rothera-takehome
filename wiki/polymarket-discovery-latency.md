# Polymarket NFL discovery latency

## Request budgets and bounded offset concurrency

Gamma publishes 4,000 general requests per ten seconds, 500 `/events` requests
per ten seconds, and 900 combined event/market listing requests per ten seconds.
Limits are IP-based, use sliding windows, and queue or delay excess traffic.
These ceilings do not specify a recommended browser concurrency or guarantee
latency. (source: polymarket-gamma-rate-limits-2026.md)

A direct-browser experiment used sequential requests and batches of three with
100-event pages. Both retained the same 43 usable NFL games, 1,223 required
markets, and 2,446 outcome tokens. The serial measurements were 4,107 and 537 ms,
and concurrent measurements were 422 and 1,944 ms. Connection and CDN warming
confound the comparison. Three requests are therefore a tested conservative
candidate, not a measured optimum or a guaranteed speedup. (source: discovery-latency/2026-10-06/observations.md)

For a bounded concurrent walk, coverage requires successful responses for every
contiguous offset through the earliest short page. A higher offset finishing
first, an empty filtered game list, or a failed required page cannot establish
completion. Deduplication cannot recover entries skipped when the listing
changes between requests. This is an algorithmic requirement inferred from the
offset array contract and the observed empty-game full pages. (source: polymarket-gamma-list-events-2026.md) (source: poking_around_api/2026-10-06/observations.md)

## Ordering and progressive discovery

The offset reference documents comma-separated `order` fields and `ascending`,
but does not enumerate permitted field names or promise snapshot consistency.
In a browser probe, `order=startTime,id&ascending=true` put all 43 usable games
on page zero. `order=id&ascending=false` put 27 on page zero and 16 on page one.
Both complete walks retained the same required market/question/token mappings
as the unordered walk. Ordering changed when games were available, without
reducing the six-page walk. (source: polymarket-gamma-list-events-2026.md)
(source: discovery-latency/2026-10-06/observations.md)

The captured application waits for `fetchGames` to resolve before publishing
games. Its unordered baseline could expose its first usable game after 1,793 ms
instead of waiting 4,107 ms for discovery completion. These are page-availability
measurements, not rendered or streaming-price timings. Progressive loading is
a project design inference: publish validated complete game objects per page,
continue the offset walk, mark partial results as incomplete, and preserve the
chosen game when sorting or adding results. A later failure must remain visible
even when provisional games are usable. (source: discovery-latency/2026-10-06/app-source.tsx) (source: discovery-latency/2026-10-06/gamma-source.ts) (source: discovery-latency/2026-10-06/observations.md)

## Filters and market coverage

The offset reference supports exact tags, excluded tags, explicit IDs/slugs,
date bounds, active/closed/archive flags, and liquidity/volume bounds. It lists
no regular-expression slug filter, series filter, or nested-market projection.
The discovery guide's sports-type filtering example uses `/markets/keyset`.
That example does not establish a supported way to trim the nested markets of
offset `/events`. (source: polymarket-gamma-list-events-2026.md)
(source: polymarket-discover-markets-2026.md)

In the tested snapshot, adding NFL `tag_id=450` saved no events. Excluding
`season-stats` tag 105127 reduced 558 events to 240 and six pages to three,
preserving all required mappings. Observed `series_id=12185` reduced the result
to 74 events and one required page, also preserving those mappings. An invalid
series returned no events, showing that the parameter was not ignored. The
series parameter is absent from the approved offset reference. Neither numeric
classification establishes future game coverage. (source: discovery-latency/2026-10-06/observations.md)

`start_date_min=2026-10-06T00:00:00Z` discarded every required game in the probe.
Game `startDate` and kickoff `startTime` differed. An end-date lower bound retained
all required mappings but removed only three events and saved no pages. The
retained games spanned October 9 through October 27, so a one-week kickoff
restriction would narrow coverage. The conservative inference is to retain the
broad NFL query and exact client-side matching until a narrowing rule has a
coverage contract. (source: discovery-latency/2026-10-06/observations.md)

## Related pages

[[polymarket-gamma-pagination]], [[polymarket-nfl-markets]], and
[[browser-metadata-caching]] cover pagination, exact game-market scope, and repeat
visit caching.
