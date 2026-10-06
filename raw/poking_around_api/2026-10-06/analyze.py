"""Analyze only the saved API responses. Makes no network requests."""
from pathlib import Path
import collections
import json
import re

run = Path(__file__).resolve().parent
slug_pattern = re.compile(r'nfl-[a-z]{2,4}-[a-z]{2,4}-\d{4}-\d{2}-\d{2}')
all_events = []
pages = []
for offset in range(0, 601, 100):
    path = run / f'gamma-events-offset-{offset}.json'
    events = json.loads(path.read_text())
    all_events.extend(events)
    pages.append({'offset': offset, 'count': len(events),
                  'gameSlugs': sum(bool(slug_pattern.fullmatch(e.get('slug', ''))) for e in events),
                  'responseBytes': path.stat().st_size})

games = []
invalid_mappings = []
for event in all_events:
    if not slug_pattern.fullmatch(event.get('slug', '')):
        continue
    moneyline = [m for m in event['markets'] if m.get('question') == event['title']]
    total_pattern = re.compile(re.escape(event['title']) + r': O/U \d+(?:\.\d+)?')
    totals = [m for m in event['markets'] if total_pattern.fullmatch(m.get('question', ''))]
    selected = moneyline + totals
    for market in selected:
        labels = json.loads(market['outcomes'])
        ids = json.loads(market['clobTokenIds'])
        valid = (len(labels) == len(ids) == 2 and len(set(ids)) == 2
                 and all(isinstance(label, str) for label in labels)
                 and all(isinstance(token, str) and token.isdigit() for token in ids))
        if not valid:
            invalid_mappings.append(market['id'])
    games.append({'slug': event['slug'], 'title': event['title'],
                  'ended': event.get('ended'), 'eventClosed': event.get('closed'),
                  'marketCount': len(event['markets']), 'moneylineCount': len(moneyline),
                  'totalCount': len(totals), 'selectedClosed': sum(m.get('closed') is True for m in selected),
                  'versions': dict(collections.Counter(m.get('version') for m in selected))})

example = next(e for e in all_events if e['slug'] == 'nfl-tb-dal-2026-10-09')
selected = [m for m in example['markets'] if m['question'] == example['title']
            or re.fullmatch(re.escape(example['title']) + r': O/U \d+(?:\.\d+)?', m['question'])]
probe = json.loads((run / 'probe-localhost-result.json').read_text())
browser = probe['response']['result']['result']['value']
books = json.loads(browser['frame'])
report = {
    'pages': pages, 'totalEvents': len(all_events),
    'uniqueEventIds': len({e['id'] for e in all_events}),
    'gameCount': len(games), 'endedGames': sum(e['ended'] is True for e in games),
    'limit500Returned': len(json.loads((run / 'gamma-events-limit-500.json').read_text())),
    'invalidMappings': invalid_mappings, 'games': games,
    'nflSportsMetadata': [s for s in json.loads((run / 'gamma-sports.json').read_text()) if s.get('sport') == 'nfl'],
    'sample': {
        'slug': example['slug'], 'marketCount': len(example['markets']),
        'selectedMarketCount': len(selected), 'outcomeRowCount': sum(len(json.loads(m['outcomes'])) for m in selected),
        'selectedQuestions': [m['question'] for m in selected],
        'excludedTeamTotals': [m['question'] for m in example['markets'] if 'Team Total' in m['question']][:8],
        'excludedPeriods': [m['question'] for m in example['markets'] if re.search(r'1H|2H|1Q|2Q|3Q|4Q', m['question'])][:8],
        'moneyline': [{k: m.get(k) for k in ['id', 'question', 'conditionId', 'version', 'outcomes', 'clobTokenIds']} for m in selected if m['question'] == example['title']],
    },
    'browser': {
        'checkedAt': probe['checkedAt'], 'origin': browser['origin'], 'gamma': browser['gamma'],
        'websocket': browser['websocket'],
        'handshakeStatuses': [d['params']['response']['status'] for d in probe['diagnostics'] if d['method'] == 'Network.webSocketHandshakeResponseReceived'],
        'frameType': type(books).__name__,
        'books': [{'asset_id': b['asset_id'], 'event_type': b['event_type'],
                   'bestBid': max(float(x['price']) for x in b['bids']) if b['bids'] else None,
                   'bestAsk': min(float(x['price']) for x in b['asks']) if b['asks'] else None,
                   'tick_size': b.get('tick_size'), 'last_trade_price': b.get('last_trade_price')} for b in books],
    },
}
print(json.dumps(report, indent=2))
