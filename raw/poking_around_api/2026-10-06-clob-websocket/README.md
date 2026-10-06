# CLOB WebSocket probe, 2026-10-06

This immutable capture records direct browser requests from a localhost page to public Polymarket APIs. No credentials or trades were involved. The local HTTP server served only the probe page and did not forward API requests.

- [probe-localhost.mjs](probe-localhost.mjs): exact Node.js and headless Chrome runner used.
- [probe-page.js](probe-page.js): exact browser code used for discovery and WebSocket tests.
- [probe-result.json](probe-result.json): complete returned browser result and Chrome DevTools WebSocket diagnostics, including handshakes, sent frames, received text frames, timestamps, and connection labels.
- [analyze.py](analyze.py): offline analysis of the saved result.
- [analysis-result.json](analysis-result.json): saved analysis, field lists, message counts, switch checks, and example messages.
- [observations.md](observations.md): test conditions, findings, and limitations.
- [requests.md](requests.md): executed command, API requests, test sequence, and initial failed attempt.
- [manifest.json](manifest.json): SHA-256 hashes of the other files.

Run the offline analysis with `python3 raw/poking_around_api/2026-10-06-clob-websocket/analyze.py`. It reads the adjacent capture and prints JSON without making network requests. Compare its output with `analysis-result.json`.

The original runner requires Node.js with built-in WebSocket support and Google Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. It reads `/private/tmp/rothera-clob-probe-page.js`, uses `/private/tmp/rothera-clob-probe-profile`, and writes `/private/tmp/rothera-clob-probe-result.json`. These paths are preserved exactly as executed. To reproduce, copy the archived page to that input path and run the archived runner. Save later results to a new directory. Fresh requests can select different games and produce different frames.
