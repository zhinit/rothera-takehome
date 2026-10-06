# Price display offline analysis

Run on 2026-10-06 from the repository root:

```sh
python3 raw/poking_around_api/2026-10-06-price-display/analyze.py
```

The exact stdout is preserved in `analysis-result.json`, including the Python version, platform, input SHA-256, message counts, a complete empty-trade example, and limitations. The input is the unchanged direct-browser capture at `../2026-10-06-clob-websocket/probe-result.json`. No new API request or browser experiment was performed. The script reads every captured frame and counts numeric boundary quotes, missing quote fields, empty book sides, snapshot tick sizes, and last-trade seed states. Numeric quote fields are inspected using Python decimal arithmetic.

An empty snapshot trade seed is observable in this sample. Empty bid or ask arrays, missing or boundary delta quotes, trade events, and tick-size change events did not occur. The results cannot establish their live behavior or universal sentinels. Counts include repeated snapshots and concurrent subscriptions. The completed run files are immutable.
