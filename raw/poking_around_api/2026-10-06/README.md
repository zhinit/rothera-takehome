# Polymarket API probes, 2026-10-06

Read [observations.md](observations.md) for the probe scope and captured results, and [requests.md](requests.md) for requests and execution details.

- `requests.json`: REST request ledger with response hashes.
- `gamma-*.json`: original REST response bodies.
- `gamma-*.headers.txt`: captured headers where available.
- `probe-file-origin.html`: preliminary browser probe.
- `probe-localhost.mjs`: successful localhost browser probe script.
- `probe-localhost-result.json`: full Chrome result, handshake, subscription frame, and book snapshots.
- `analyze.py`: offline analysis of the saved results.
- `analysis-result.json`: complete offline analysis output.

These files are a completed research snapshot. Preserve them unchanged. Later probes should use a new dated directory. The original localhost script writes to its original `/private/tmp` paths and requires Node.js with built-in WebSocket support and Google Chrome at the recorded macOS path. Rerunning it makes new live requests and produces new observations. The offline analysis can be rerun without contacting the API.
