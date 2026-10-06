"""Analyze a saved capture without contacting any API."""
import collections
import json
import sys
from pathlib import Path

capture = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name('probe-result.json')
root = json.loads(capture.read_text())
data = root['response']['result']['result']['value']
counts = collections.defaultdict(collections.Counter)
keys = collections.defaultdict(set)
samples = {}
decoded = []
containers = collections.Counter()
seed_missing = collections.Counter()
delta_missing = collections.Counter()
for frame in data['frames']:
    try:
        payload = json.loads(frame['data'])
    except ValueError:
        counts[frame['connection']][frame['data']] += 1
        continue
    containers[type(payload).__name__] += 1
    for message in payload if isinstance(payload, list) else [payload]:
        event_type = message.get('event_type', 'unknown')
        counts[frame['connection']][event_type] += 1
        keys[event_type].update(message)
        samples.setdefault(event_type, message)
        decoded.append((frame, message))
        if event_type == 'book':
            for key in ['tick_size', 'last_trade_price']:
                if key not in message: seed_missing[key] += 1
        if event_type == 'price_change':
            for item in message['price_changes']:
                keys['price_change.item'].update(item)
                for key in ['best_bid', 'best_ask']:
                    if key not in item: delta_missing[key] += 1

phases = [a for a in data['actions'] if a['kind'] == 'phase']
groups = [{token for market in event['markets'] for token in market['ids']} for event in data['events']]
switches = []
for index, (phase, expected, old) in enumerate(zip(phases[:2], [groups[1], groups[0]], [groups[0], groups[1]])):
    end = phases[index + 1]['at']
    relevant = [(f,m) for f,m in decoded if phase['at'] <= f['at'] < end]
    main = [(f,m) for f,m in relevant if f['connection'] == 'switch']
    switched_assets = {m['asset_id'] for f,m in main if m['event_type'] == 'book'}
    changed_assets = [c['asset_id'] for f,m in main if m['event_type'] == 'price_change' for c in m['price_changes']]
    control = sum(c['asset_id'] in old for f,m in relevant if f['connection'] == 'no-heartbeat' and m['event_type'] == 'price_change' for c in m['price_changes'])
    switches.append({'phase':phase['phase'],'snapshot_assets':len(switched_assets),'expected_assets':len(expected),'snapshot_set_matches':switched_assets==expected,'delta_items':len(changed_assets),'old_asset_delta_items':sum(a in old for a in changed_assets),'old_asset_delta_items_on_control_connection':control})

reconnected = {m['asset_id'] for f,m in decoded if f['connection']=='reconnect' and m['event_type']=='book'}
idle_start = next(a['at'] for a in data['actions'] if a['kind']=='open' and a['connection']=='no-heartbeat')
idle_end = next(a for a in data['actions'] if a['kind']=='idle-end')
report = {
    'startedAt':data['startedAt'],'finishedAt':data['finishedAt'],'origin':data['origin'],
    'events':[{'slug':e['slug'],'markets':len(e['markets']),'assets':len(g)} for e,g in zip(data['events'],groups)],
    'frame_count':len(data['frames']),'json_container_counts':dict(containers),
    'message_counts':{k:dict(v) for k,v in counts.items()},'observed_keys':{k:sorted(v) for k,v in keys.items()},
    'missing_snapshot_seed_fields':dict(seed_missing),'missing_delta_best_fields':dict(delta_missing),
    'switch_checks':switches,'reconnect_snapshot_assets':len(reconnected),'reconnect_snapshot_set_matches':reconnected==groups[0],
    'no_heartbeat_observation':{'seconds':(idle_end['at']-idle_start)/1000,'readyState_at_end':idle_end['readyState']},
    'examples':samples,
    'limits':['No last_trade_price or tick_size_change events observed.', 'Reconnect was an intentional clean close followed by a new connection, not a network outage.', 'The no-heartbeat connection received market updates throughout its observation window.', 'Gamma response bodies were not retained by this probe, only page statuses and selected market identifiers.']
}
print(json.dumps(report, indent=2))
