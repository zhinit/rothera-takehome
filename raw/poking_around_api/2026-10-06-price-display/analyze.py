"""Offline analysis of the preserved NFL capture. No network requests."""
from collections import Counter
from decimal import Decimal
from hashlib import sha256
from pathlib import Path
import json
import platform
import sys

root = Path(__file__).resolve().parents[3]
source = root / "raw/poking_around_api/2026-10-06-clob-websocket/probe-result.json"
capture = json.loads(source.read_text())["response"]["result"]["result"]["value"]
counts = Counter()
ticks = Counter()
last_states = Counter()
examples = {}
for frame_index, frame in enumerate(capture["frames"]):
    try:
        messages = json.loads(frame["data"])
    except json.JSONDecodeError:
        continue
    for message in messages if isinstance(messages, list) else [messages]:
        event = message["event_type"]
        counts[event] += 1
        if event == "book":
            ticks[message.get("tick_size")] += 1
            value = message.get("last_trade_price")
            state = "absent" if "last_trade_price" not in message else (
                "null" if value is None else "empty" if value == "" else "numeric"
            )
            last_states[state] += 1
            if state != "numeric":
                examples.setdefault(state, {"frame_index": frame_index, "connection": frame["connection"], "message": message})
            for side in ["bids", "asks"]:
                if not message[side]:
                    counts["empty_" + side] += 1
        elif event == "price_change":
            for change in message["price_changes"]:
                counts["delta_items"] += 1
                for side in ["best_bid", "best_ask"]:
                    value = change.get(side)
                    if value is None or value == "" or Decimal(value) in [Decimal(0), Decimal(1)]:
                        counts[side + "_missing_or_boundary"] += 1
result = {
    "environment": {"python": sys.version, "platform": platform.platform()},
    "source": str(source.relative_to(root)),
    "source_sha256": sha256(source.read_bytes()).hexdigest(),
    "counts": {key: counts[key] for key in ["book", "price_change", "delta_items", "last_trade_price", "tick_size_change", "empty_bids", "empty_asks", "best_bid_missing_or_boundary", "best_ask_missing_or_boundary"]},
    "snapshot_last_trade_states": dict(last_states),
    "snapshot_tick_sizes": dict(ticks),
    "examples": examples,
    "limitations": [
        "Counts include repeated snapshots and parallel connections, not unique markets.",
        "This is an offline reanalysis of the October 6 NFL capture, not a new live probe.",
        "No empty-side or boundary delta quote was observed, so no empty-side sentinel is established.",
        "An empty snapshot trade string establishes an unavailable seed, not independently verified absence of historical trades.",
    ],
}
print(json.dumps(result, indent=2))
