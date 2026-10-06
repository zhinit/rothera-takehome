# Browser metadata caching

## HTTP cache and application metadata

Fetch's default cache mode can reuse fresh HTTP responses and conditionally
revalidate stale responses. `no-cache` revalidates even a fresh entry, while
`no-store` bypasses and does not populate the browser HTTP cache. `force-cache`
can reuse stale data. `only-if-cached` requires same-origin request mode, so it
does not fit direct cross-origin Gamma requests. (source: mdn-request-cache-2026.md)

Direct-browser Gamma responses in the probe advertised `public, max-age=300`
and Last-Modified. A repeated default-mode offset-zero request was served from
the browser disk cache. A subsequent `no-cache` request produced wire HTTP 304
and a browser-visible 200. Browser reuse is already available for the captured
application's ordinary fetch calls, subject to cache availability and response
policy. It still requires processing the large response body and does not
establish an atomic or fresh-origin multi-page catalog. (source: discovery-latency/2026-10-06/observations.md) (source: discovery-latency/2026-10-06/gamma-source.ts)

The captured parser reduced 73,087,658 decoded REST bytes to 390,478 bytes of
normalized game metadata while retaining 43 games, 1,223 required markets, and
2,446 outcomes. Ten warm localStorage read-and-parse samples of a 390,553-byte
versioned fixture took 0.4 to 0.7 ms on desktop Chrome. These are feasibility
measurements, not first-visit, reload, or mobile startup benchmarks. (source: discovery-latency/2026-10-06/observations.md)

## Storage choices

Web Storage uses synchronous key/value operations. localStorage is partitioned
by origin and persists across browser sessions, while sessionStorage is also
partitioned by tab and ends with that tab. Large synchronous reads and writes
can block JavaScript. (source: mdn-web-storage-2026.md)

IndexedDB provides asynchronous operations, object stores, and transactions.
It requires database opening, schema/version management, and handling blocked
upgrades and failures. This offers a larger-dataset option but adds lifecycle
work relative to a single compact metadata value. The complexity comparison is
an implementation inference from these APIs. (source: mdn-using-indexeddb-2026.md)
(source: mdn-web-storage-2026.md)

The Cache API asynchronously stores Request/Response pairs and is available to
window code without a service worker in secure contexts. Entries require
explicit updates/deletion and do not honor HTTP caching headers. Caches should
be versioned and can be evicted. It does not automatically supply metadata TTLs.
(source: mdn-cache-api-2026.md)

## Coverage and refresh design

A project cache should remain provisional until a complete offset refresh
finishes. This follows from observed catalog growth between probes and the
application's reliance on Gamma for usable markets and token mappings. Cache
age alone cannot prove that no game or alternate total was added or closed.
The cache fixture's completion flag means a prior walk completed, not that its
contents remain current. (source: poking_around_api/2026-10-06/observations.md)
(source: discovery-latency/2026-10-06/observations.md) (source: discovery-latency/2026-10-06/gamma-source.ts)

Recommended design, inferred from the captured implementation and storage
contracts: persist compact metadata after a successful full walk, version it,
validate decoded data as unknown, reject corrupt or incompatible entries,
handle unavailable storage as a cache miss, and always refresh directly from
Gamma. A failed refresh must not replace a complete snapshot with partial data.
Keep cached results marked as provisional, preserve selection by game ID, and
reconcile changed token membership before declaring live market coverage current.
Choose any maximum age as a documented product decision, since the sources do
not establish a safe metadata TTL. (source: mdn-web-storage-2026.md)
(source: discovery-latency/2026-10-06/gamma-source.ts) (source: discovery-latency/2026-10-06/app-source.tsx)

Persisting only game/market descriptors and token IDs avoids replaying stale
prices. The application's subscription changes and quote seeding remain the
path for current quotes. If a refreshed selected game is unchanged, preserve
its object or compare its asset membership before updating subscriptions.
The captured App depends on the selected game object's identity, making
unnecessary replacement a potential resubscription trigger. This is an
implementation inference, not a tested progressive-refresh behavior. (source: discovery-latency/2026-10-06/app-source.tsx) (source: discovery-latency/2026-10-06/market-stream-source.ts)

## Related pages

[[polymarket-discovery-latency]], [[polymarket-gamma-pagination]], and
[[polymarket-browser-access]] cover discovery completion and direct-browser access.
