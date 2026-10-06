# Polymarket API requests, 2026-10-06

These are the URLs, curl options, and browser operations used in this research. Saved JSON response bodies are byte-for-byte copies of the captured bodies. Only offsets 0 and 100 have saved event response headers. The request file SHA-256 hashes are in `requests.json`.

## REST requests

The following commands reconstruct the executed curl requests with archive-local output filenames. No API keys or credentials were sent.

```sh
curl -L --fail -sS -H 'Origin: http://localhost:5173' -o 'gamma-events-offset-0.json' 'https://gamma-api.polymarket.com/events?tag_slug=nfl&active=true&closed=false&limit=100&offset=0'
curl -L --fail -sS -o 'gamma-events-offset-100.json' 'https://gamma-api.polymarket.com/events?tag_slug=nfl&active=true&closed=false&limit=100&offset=100'
curl -L --fail -sS -o 'gamma-events-offset-200.json' 'https://gamma-api.polymarket.com/events?tag_slug=nfl&active=true&closed=false&limit=100&offset=200'
curl -L --fail -sS -o 'gamma-events-offset-300.json' 'https://gamma-api.polymarket.com/events?tag_slug=nfl&active=true&closed=false&limit=100&offset=300'
curl -L --fail -sS -o 'gamma-events-offset-400.json' 'https://gamma-api.polymarket.com/events?tag_slug=nfl&active=true&closed=false&limit=100&offset=400'
curl -L --fail -sS -o 'gamma-events-offset-500.json' 'https://gamma-api.polymarket.com/events?tag_slug=nfl&active=true&closed=false&limit=100&offset=500'
curl -L --fail -sS -o 'gamma-events-offset-600.json' 'https://gamma-api.polymarket.com/events?tag_slug=nfl&active=true&closed=false&limit=100&offset=600'
curl -L --fail -sS -H 'Origin: http://localhost:5173' -o 'gamma-sports.json' 'https://gamma-api.polymarket.com/sports'
curl -L --fail -sS -o 'gamma-events-limit-500.json' 'https://gamma-api.polymarket.com/events?tag_slug=nfl&active=true&closed=false&limit=500&offset=0'
```

## Browser requests

`probe-file-origin.html` fetched offset 0 with `credentials: omit`, then attempted the market WebSocket with two assets from the first open market. The initial headless `--dump-dom` output still showed `pending`. Adding `--virtual-time-budget=20000` produced REST status 200 and a WebSocket error. This preliminary run has only a recorded outcome, not a complete saved console transcript.

`probe-localhost.mjs` served a static HTML page at a dynamically assigned localhost port. It fetched offset 300 with `credentials: omit`, selected the Buccaneers versus Cowboys moneyline, opened `wss://ws-subscriptions-clob.polymarket.com/ws/market`, and sent `{assets_ids: [both token IDs], type: "market", initial_dump: true}`. The full subscription frame, handshake, snapshots, and original script are saved. The local server did not forward API requests.

## Execution failures

Two official-document fetches initially failed with curl error 6, host resolution failure, inside the sandbox. They succeeded when retried with escalated execution. The first sandboxed Chrome command exited with status 134. Headless Chrome was retried outside the sandbox. These are execution-environment failures, not evidence of API access restrictions.
