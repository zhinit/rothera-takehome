# NFL discovery latency probe, 2026-10-06

This is a completed research snapshot. Preserve it unchanged. New runs must use
a new directory and new output names. No application code was changed.

## Environment and method

macOS, Node.js v26.8.2, headless Chrome 154.0.0.0. `frontend-package.json`
records the application toolchain. `probe.mjs` and `cache-probe.mjs` each serve a
static HTML document on an ephemeral localhost port and evaluate requests in
Chrome. Gamma requests go directly from the browser to the public endpoint,
with `credentials: omit`. The local server only serves HTML and never forwards
API requests. A temporary Chrome profile is used for each invocation.

Discovery comparisons use `cache: no-store`, limit 100, contiguous offsets, and
either one request at a time or batches of three. All pages in each batch are
awaited. Only pages at or below the first short page count toward coverage.
The probe has a 3,000-offset safety ceiling and 20-second request timeout.
No scenario reached that ceiling or returned a failed request. Each scenario's
exact query strings, statuses, accessible headers, and timings are saved in its
`*-result.json`. Complete decoded REST body text is saved in `*-offset-*.json`.
Bodies are saved without reformatting. DevTools network captures include response
headers and cache/connection metadata for the initial and follow-up scenarios.
Browser request concurrency is bounded. This experiment did not test rate-limit
exhaustion and does not establish an optimum concurrency value.

The first-game metric checks the assignment slug and event state after JSON
parsing. `analyze.mjs` additionally applies the captured application's exact
`parseGame` to every retained page and derives first-usable-game timings, game
IDs, market IDs/questions, and paired outcome labels/token IDs. `gamma-source.ts`,
`types-source.ts`, `app-source.tsx`, and `market-stream-source.ts` are unchanged application snapshots.
The analyzer transpiles the snapshots with the installed TypeScript compiler.
`analysis-result.json` contains the full comparison and hashes of sorted market
mappings. `normalized-games.json` and `metadata-cache-fixture.json` are derived
from the serial baseline using that parser, with no quotes or order books.

The cache probe measures compact metadata reads in isolated localStorage and
Cache API storage. It also requests Gamma offset zero twice with default HTTP
caching, followed by `no-cache`. It saves the measured output and complete
DevTools request/response events in `cache-result.json`. Gamma body content from
these three cache requests is consumed, not separately archived. Cache claims
use headers, wire statuses, cache flags, and byte counts in that artifact.
This probe does not implement application cache validation, TTLs, refresh UI,
cross-tab behavior, or WebSocket reconciliation. Storage timing samples are
same-page warm reads, not a measured dashboard startup or reload benchmark.

## Exact commands and execution history

From the repository root:

```sh
node raw/discovery-latency/2026-10-06/probe.mjs raw/discovery-latency/2026-10-06/initial-config.json
node raw/discovery-latency/2026-10-06/probe.mjs raw/discovery-latency/2026-10-06/followup-config.json
node raw/discovery-latency/2026-10-06/analyze.mjs
node raw/discovery-latency/2026-10-06/cache-probe.mjs
```

The first command initially failed inside the filesystem/network sandbox with
`Error: listen EPERM: operation not permitted 127.0.0.1`, exiting with status 1.
It was rerun with approved escalation and succeeded. Both browser follow-up
commands used the same approved escalation. The offline analyzer succeeded
inside the sandbox. That initial failure concerns localhost sandbox access,
not Gamma or browser CORS. No browser runtime exceptions were recorded in the
successful captures.

The scripts use the repository's Chrome helper. Its captured implementation is
`chrome-helper.mjs`. Output files use exclusive creation and cannot be overwritten
by rerunning the scripts as written. Copy scripts and snapshots into a new run
directory and adapt imports/output locations for a subsequent run.

## Limitations

Sequential scenarios share a Chrome connection and can warm the CDN. Browser
HTTP caching was disabled for discovery comparisons, but CDN caching was not.
Each schedule has only two unordered-query timing samples. They are observations,
not a randomized performance benchmark. Payload bytes mean decoded JSON UTF-8,
not compressed bytes on the wire. Metrics exclude React rendering, DOM work,
WebSocket snapshots, and the time Node spent archiving DevTools results between
scenarios. No selected-game refresh race or partial-page failure was induced.

Filters and ordering were tested on one changing catalog. Equality of captured
games, market IDs, questions, and token mappings does not prove permanent
classification coverage or snapshot consistency. The series filter is observed
behavior absent from the approved offset endpoint reference. Invalid-series
control demonstrates that the parameter was not simply ignored. The numeric
series and exclusion-tag IDs came from existing metadata and captured events.

Approved source documents are listed in `source-catalog.json`. HTML and full
upstream Markdown are archived in `raw/html/` and `raw/md/`. Existing discovery
and offset documentation are reused. SHA-256 digests are in `sha256.json`.
