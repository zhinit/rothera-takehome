# Discovery and caching observations

## Baseline and coverage

The browser's baseline walk returned 558 distinct events on six nonempty pages
(100, 100, 100, 100, 100, 58). The captured application parser retained 43 games,
43 moneylines, 1,180 full-game totals, 1,223 markets, and 2,446 outcome tokens.
This differs from the earlier 552-event probe because the catalog changed.
All coverage comparisons below are against this run's baseline, not the earlier
snapshot. Evidence: `baseline-serial-result.json`, full baseline bodies, and
`analysis-result.json`. The mapping digest is
`6fba2be058e870d965717e55b72abf233e4ba9854a294c915b197bce5a84995c`.

## Offset schedules and ordering

| Scenario | First usable game | Full browser walk | Retained events | Games | Markets |
| --- | ---: | ---: | ---: | ---: | ---: |
| Serial baseline | 1,793 ms | 4,107 ms | 558 | 43 | 1,223 |
| Three concurrent requests, subsequent run | 171 ms | 422 ms | 558 | 43 | 1,223 |
| Three concurrent requests, repeat in new Chrome session | 968 ms | 1,944 ms | 558 | 43 | 1,223 |
| Serial repeat, after concurrent repeat | 266 ms | 537 ms | 558 | 43 | 1,223 |
| `order=id&ascending=false`, concurrency 3 | 968 ms | 1,834 ms | 558 | 43 | 1,223 |
| `order=startTime,id&ascending=true`, concurrency 3 | 1,747 ms | 2,265 ms | 558 | 43 | 1,223 |

All these runs retained identical game IDs, market IDs/questions, and outcome
label/token mappings. They do not demonstrate a stable speedup factor: the
second serial run beat the second concurrent run. The first serial network
capture shows an initial DNS/TLS connection and Cloudflare MISS responses.
Later captures include HIT responses. `cache: no-store` prevents browser HTTP
reuse but does not prevent CDN warming. Evidence: scenario result files,
`baseline-serial-network.json`, `exclude-season-stats-network.json`, and
`analysis-result.json`.

Unordered queries had usable games on offsets 300, 400, and 500. Descending ID
ordering put 27 usable games on offset zero and 16 on offset 100. Start-time
ordering put all 43 on offset zero. Both ordered full walks still required six
nonempty pages. Progressive publication could expose the initial usable games
at the recorded page-completion time, but the experiment did not render a
dashboard or measure first live prices. Evidence: `analysis-result.json` and
the full ordered response bodies.

## Filtering

| Added query parameters | Retained events | Terminal offset | Games | Markets | Same required mappings? |
| --- | ---: | ---: | ---: | ---: | --- |
| `tag_id=450` alongside `tag_slug=nfl` | 558 | 500 | 43 | 1,223 | Yes |
| `exclude_tag_id=105127` | 240 | 200 | 43 | 1,223 | Yes |
| `series_id=12185` | 74 | 0 | 43 | 1,223 | Yes |
| `series_id=999999999` control | 0 | 0 | 0 | 0 | No |
| `end_date_min=2026-10-06T00:00:00Z` | 555 | 500 | 43 | 1,223 | Yes |
| `start_date_min=2026-10-06T00:00:00Z` | 31 | 0 | 0 | 0 | No |

The baseline had 318 events tagged `105127` / `season-stats`, none among the
43 retained games. Excluding them removed exactly 318 events, reduced the walk
to three pages, and put all retained games on offset 100. Its 58,261,796 decoded
bytes were about 20% below the 73,087,658-byte baseline. The series query returned
45,504,577 bytes, about 38% below baseline. Short-result scenarios sent up to two
speculative requests past the terminal page due to batches of three. These were
not included in coverage. The series parameter works in this capture, including
the empty invalid-series control, but is not listed in the approved offset
reference. No classification guarantees were tested. Evidence: full query bodies,
scenario result files, and `analysis-result.json`.

The baseline games' kickoff `startTime` values span October 9 to October 27.
An example has `startDate: 2026-09-15T12:00:51Z` and
`startTime: 2026-10-27T00:15:00Z`. A lower start-date bound at October 6 removed
all 43 retained games. A one-week kickoff window would also exclude required
games beyond that window. The end-date bound removed only three irrelevant
events in this snapshot and did not reduce the page count. Neither date test
establishes a safe permanent narrowing rule. Evidence: `analysis-result.json`
and the full date-filter responses.

## Browser caching and payload size

The captured application parser reduced the baseline to 390,478 bytes of
normalized games, versus 73,087,658 bytes of decoded REST JSON. The cache fixture
including a version, saved time, and completion flag was 390,553 bytes. This
fixture contains all 43 games and 1,223 required markets and no quote state.
It is derived data, not a production cache format or validator. Evidence:
`normalized-games.json`, `metadata-cache-fixture.json`, and `analysis-result.json`.

Ten same-page localStorage read-plus-JSON-parse samples took 0.4 to 0.7 ms,
with a median of 0.5 ms. A single write took 0.6 ms. Cache API write and
read-plus-parse took 1.8 and 1.3 ms respectively. These timings describe one
desktop Chrome environment and a warm fixture. They do not establish startup,
reload, mobile, or cross-session performance. Evidence: `cache-result.json`.

Gamma offset zero returned `Cache-Control: public, max-age=300`, `Last-Modified`,
`Vary: Accept-Encoding,Origin`, and `Access-Control-Allow-Origin: *`. With default
HTTP caching, the first fetch consumed its body in 629 ms. The second consumed
the same 9,449,976 decoded bytes in 24 ms, with DevTools reporting
`fromDiskCache: true`. A following `cache: no-cache` request took 77 ms.
DevTools recorded wire HTTP 304 and a browser-visible HTTP 200 response for
that revalidation. The edge reported HIT, so this does not prove a fresh
origin-generated catalog. Browser HTTP reuse still incurs body/JSON processing
and cannot be assumed available on every first visit. Evidence: `cache-result.json`.

The network captures also show offset-endpoint deprecation headers and a
warning to use keyset pagination. The endpoint returned HTTP 200 throughout
these tests. Offset pagination remains an assignment requirement. This observed
header does not authorize changing pagination methods. Evidence:
`baseline-serial-network.json` and `cache-result.json`.

## Interpretation boundaries

No API rate-limit exhaustion, synthetic network delay, page failure, storage
corruption, partial-cache reconciliation, subscription mutation, or rendering
measurement was performed. The archive records successful coverage comparisons,
timing variability, existing HTTP caching, and metadata-storage feasibility.
Implementation recommendations require the distinctions in `README.md`.
