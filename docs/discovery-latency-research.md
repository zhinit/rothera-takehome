# Reducing initial NFL discovery latency

Research completed on 2026-10-06. Application code is unchanged. The assignment's
direct-browser requests, offset pagination, exact game-slug matching, and every
usable moneyline/full-game-total market remain the constraints.

## Recommendation

The simplest improvement with no new exclusion rule is **progressive publication
with `order=startTime,id&ascending=true`**, while continuing the complete offset
walk. The probe placed all 43 usable games on page zero with identical required
market and outcome/token mappings. This can make a game selectable before
discovery finishes, without claiming the slate is complete. Ordering alone does
not shorten the current application's loading screen because App waits for the
entire `fetchGames` promise.

A cap of three concurrent offset requests is a reasonable second change to
evaluate. It preserved coverage and overlaps request waits, but the measurements
do not establish a fixed improvement or an optimal cap. Start with a small fixed
batch rather than an elaborate scheduling or rate-limiting abstraction. Preserve
the existing request timeout and cancellation.

For repeat visits, ordinary fetch already benefits from Gamma's browser HTTP
cache. Add a compact metadata cache only if the improved cold-load flow is still
insufficient. It adds validation, freshness UI, and subscription reconciliation,
so it is lower priority for this take-home.

Evidence is in [discovery latency](../wiki/polymarket-discovery-latency.md),
[browser metadata caching](../wiki/browser-metadata-caching.md), and the
[immutable probe archive](../raw/discovery-latency/2026-10-06/README.md).

## Current bottleneck and observations

`frontend/src/api/gamma.ts` walks 100-event pages sequentially until a short page,
deduplicates parsed games, and sorts live games first, then kickoff and title.
`frontend/src/App.tsx` publishes only the final result. Its existing parser keeps
all usable exact-title moneylines and exact full-game totals. The discovery tests
already cover empty-game full pages, late-page failures, and cancellation.

The new baseline returned 558 distinct events, 43 usable games, 43 moneylines,
1,180 totals, and 2,446 outcomes across six pages. Three initial pages contained
no usable games. This snapshot differs from the earlier 552-event listing.
Discovery responses totaled 73.1 MB of decoded JSON. That figure is not compressed
network transfer. JSON parsing alone totaled roughly 99 to 125 ms across the
successful full-catalog comparisons, excluding application parsing/rendering.

| Query or schedule | Usable games on page zero | Required pages | Required mappings preserved |
| --- | ---: | ---: | --- |
| Current unordered query | 0 | 6 | Baseline |
| Same query, concurrency 3 | 0 | 6 | Yes |
| `order=id&ascending=false` | 27 | 6 | Yes |
| `order=startTime,id&ascending=true` | 43 | 6 | Yes |
| Exclude season-stat tag 105127 | 0, all 43 on page one | 3 | Yes, this snapshot |
| Observed `series_id=12185` | 43 | 1 | Yes, this snapshot |
| Add `end_date_min=2026-10-06T00:00:00Z` | 0 | 6 | Yes, this snapshot |
| Add `start_date_min=2026-10-06T00:00:00Z` | 0 | 1 | No, all 43 games lost |

The first serial run took 4.1 seconds, with a usable game available after 1.8
seconds. The subsequent concurrent run took 0.42 seconds. In a new Chrome
session, concurrency took 1.94 seconds and the following serial run took 0.54
seconds. DNS/TLS setup and edge cache warming confound these pairs. These are
browser page-availability observations, not a randomized benchmark or time to
rendered live quotes. A larger payload on page zero can also delay its arrival,
even when ordering moves games forward.

## Coverage rules for a future change

Keep `tag_slug=nfl&active=true&closed=false&limit=100`. Add the observed ordering
to every page and retain the client parser. ID provides a unique secondary
ordering candidate, though the endpoint provides no snapshot-consistency contract.
Do not infer completion from ordering or a page with no parsed games.

Publish once per completed page or batch. Track results, completion, and errors
separately so games can be selectable during discovery. Set the initial selected
ID once, preserve it as new results arrive, and continue to apply the existing
live-first UI ordering. Announce an empty slate only after the complete walk.
If a required page fails, retain any useful provisional games with an explicit
incomplete/error state and retry action.

For concurrency, resolve all required offsets through the earliest successful
short page. Handle out-of-order completion and deduplicate game IDs. A failed
lower page cannot be hidden by a successful higher or terminal page. Responses
strictly beyond a known terminal page are speculative and do not contribute to
the slate. At most two extra requests are possible with batches of three.
Cancel outstanding work on retry/unmount and suppress stale progress callbacks.
No fixed maximum page count should silently truncate discovery.

Keep game metadata stable when unchanged. App's subscription Effect depends on
the selected game object. Replacing that object during progress/refresh can
trigger unnecessary `setAssets` calls even when its token list is identical.
When actual selected-game token membership changes, reconcile subscriptions and
request fresh seeds through the existing streaming path. Do not persist quotes
or stream state in a metadata cache.

## Filters to defer

The approved offset reference lists tag exclusions and date bounds but no
regex-slug filter, nested-market projection, or `series_id`. The discovery guide's
sports-market-type query targets keyset markets. It does not establish a way to
reduce the nested event payload while retaining the required offset-event walk.

Season-stat exclusion saved three pages and about 20% of decoded payload while
preserving mappings. Series filtering saved five required pages and about 38%
of decoded payload. Both depend on classification being complete, and the series
filter lacks documentation in the approved endpoint reference. Neither should
replace the broad discovery walk if permanent coverage is required. A fast-path
followed by a broad reconciliation walk would preserve coverage, but adds work
and complexity beyond the simplest recommendation.

`startDate` predates kickoff in captured games, and the tested lower bound lost
all required games. The end-date bound saved no pages. Arbitrary week windows,
featured-only queries, liquidity/volume thresholds, or selected main-line totals
would introduce scope restrictions without a coverage guarantee. Adding tag ID
450 alongside the NFL slug returned the same 558 events and offered no benefit.

## Browser metadata cache option

The current fetch does not set a cache mode. Captured Gamma responses advertised
`public, max-age=300`. A second default-mode offset-zero fetch used the browser
disk cache and consumed its body in 24 ms versus 629 ms initially. Revalidation
with `no-cache` produced wire HTTP 304, while fetch exposed HTTP 200. It still
consulted an edge cache. Freshness is not equivalent to an origin-generated,
atomic multi-page snapshot.

A compact normalized snapshot of the full required game/market metadata was
390 KB. localStorage read plus JSON parsing had a 0.5 ms median across ten warm
same-page reads. That supports trying one versioned localStorage value if needed,
with storage failures treated as misses. Keep it small because operations are
synchronous. sessionStorage only helps the same tab. IndexedDB adds asynchronous
database/schema lifecycle work. Cache API needs explicit versioning, expiry, and
cleanup even though it can run without a service worker. Neither is required for
this small optional cache.

Store a schema version, save time, query/scope identity, and data from a completed
walk. Validate stored metadata as `unknown`. Normalized Game data needs its own
validator, or a compact provider-shaped cache can reuse `parseGame`. Any age limit
is a product choice, not a source-proven freshness guarantee. Always start a full
direct-browser refresh. Show cached data as provisional and atomically replace
the saved snapshot only after success. Reconcile selected-game market membership
before presenting coverage as current. Partial failures must not overwrite the
complete cache.

## Validation for later implementation

Use controlled HTTP responses to cover out-of-order pages, a late lower-page
failure, speculative failures after the terminal page, exact-multiple totals,
retry/unmount cancellation, progress after cleanup, stable selection, and all
alternate totals/token mappings. For caching, cover corrupt/incompatible data,
storage failures, added/removed games and totals, refresh failure, and unchanged
token sets retaining their subscription.

Measure time to first selectable game, completed slate, and first live snapshot
separately. Compare schedules in alternating order under controlled latency as
well as live conditions. No frontend implementation was made in this research.
The offset endpoint returned deprecation headers, but offset remains required
by the assessment and was retained throughout.
