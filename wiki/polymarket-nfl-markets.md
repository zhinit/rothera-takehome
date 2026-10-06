# Polymarket NFL events and markets

## Event grouping and sports metadata

An event groups markets. Sports companion events can have suffixes such as `-player-props`, `-halftime-result`, and `-more-markets`. Sports metadata exposes a sport's tags and series. The observed NFL metadata reported `primaryTagId: 450`, tags `1,450,100639`, and series `12185`. These identifiers describe the captured response and may change. (source: polymarket-discover-markets-2026.md) (source: polymarket-sports-metadata-2026.md) (source: poking_around_api/2026-10-06/observations.md)

Across the saved NFL event pages, 44 slugs matched `^nfl-[a-z]{2,4}-[a-z]{2,4}-\d{4}-\d{2}-\d{2}$`. One was marked `ended: true`. Matching this shape excluded suffix-bearing companion events and the futures or entertainment slugs seen in earlier pages. This is a description of the recorded matching operation, not a guarantee about every future NFL slug. (source: poking_around_api/2026-10-06/observations.md)

## Moneyline and full-game totals

The captured Buccaneers versus Cowboys event, `nfl-tb-dal-2026-10-09`, contained 328 nested markets. Exactly one had a question equal to the event title, `Buccaneers vs. Cowboys`, and reported `sportsMarketType: moneyline`. Its outcome labels were `Buccaneers` and `Cowboys`. (source: poking_around_api/2026-10-06/observations.md)

Exactly 42 markets had questions of the form `Buccaneers vs. Cowboys: O/U {number}`, with no additional prefix or suffix. They reported `sportsMarketType: totals` and outcome labels `Over` and `Under`. The recorded analysis used an escaped event title followed by `: O/U \d+(?:\.\d+)?`, matching the entire question. Combined with the moneyline, this yielded 43 markets and 86 outcomes. (source: poking_around_api/2026-10-06/observations.md) (source: polymarket-nfl-events-offset-300-2026.md)

The same array also included questions such as `Buccaneers Team Total: O/U 10.5` and `1H Spread: Buccaneers (-1.5)`. These failed the exact full-game question match. The official discovery guide explains `sportsMarketType` and lists moneyline, spread, and total classifications, while `/sports/market-types` documents the available-type endpoint. (source: poking_around_api/2026-10-06/observations.md) (source: polymarket-discover-markets-2026.md) (source: polymarket-sports-market-types-2026.md)

## Event state and nested market state

The open-event query returned `nfl-mia-min-2026-10-04`, whose event had `closed: false` and `ended: true`. Its exact-title moneyline and all 26 matched full-game totals had `closed: true`. Event-level filtering did not imply open nested markets in this snapshot. The official market guide separately defines `active`, `closed`, `acceptingOrders`, and `enableOrderBook`. (source: poking_around_api/2026-10-06/observations.md) (source: polymarket-market-details-2026.md)

The Buccaneers versus Cowboys event had `startTime: 2026-10-09T00:15:00Z` and `eventDate: 2026-10-08`, while its slug ended in `2026-10-09`. Those fields had different calendar dates in the captured object. (source: polymarket-nfl-events-offset-300-2026.md)

## Related pages

[[polymarket-gamma-pagination]] covers the full event walk. [[polymarket-outcome-token-mapping]] describes outcome identifiers.
