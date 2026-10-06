# Polymarket outcome and token mapping

## Raw Gamma representation

Gamma REST returns `outcomes` and `outcomePrices` as JSON-encoded strings. For CTF markets with `version: v1`, `clobTokenIds` is also a JSON-encoded string. Parsing each field produces arrays whose entries at the same index describe the same outcome. This raw representation differs from the SDK's structured `outcomes.yes` and `outcomes.no` objects. (source: polymarket-market-details-2026.md) (source: polymarket-discover-markets-2026.md)

The captured Buccaneers versus Cowboys moneyline had the following parallel arrays. The complete market object is in the saved offset-300 response, and the recorded analysis retains these exact fields. (source: poking_around_api/2026-10-06/observations.md)

| Index | Outcome label | CLOB token ID |
| --- | --- | --- |
| 0 | Buccaneers | `41073895388163492044683513841262626450248745686629069268834561009386173172680` |
| 1 | Cowboys | `66616602105135321479456151494379932980062039030841962258728108349184895983957` |

The observed full-game totals used `Over` and `Under` labels with corresponding token IDs at the same indices. Across all selected moneyline and total markets in the 44 game-shaped events, the offline analysis found two string labels and two distinct decimal-string token IDs per market, with no array-shape failures. This validates the recorded data shape. It does not independently verify token ownership on chain. (source: poking_around_api/2026-10-06/observations.md)

## Identifier roles and protocol versions

The Gamma market `id`, its `conditionId`, and its outcome asset IDs have separate roles. The public market WebSocket accepts outcome IDs in `assets_ids`, then identifies an outcome in book messages using `asset_id`. The message's `market` field is the condition ID. The successful browser capture subscribed to the two token IDs above and received book messages containing those IDs. (source: polymarket-market-details-2026.md) (source: polymarket-market-websocket-2026.md) (source: poking_around_api/2026-10-06/observations.md)

Current official documentation also describes Protocol V2 markets, where `positionIds` is already an array and the market version determines the asset-identifier field. Both identifier fields can be populated, so presence alone does not select a protocol. Every selected NFL market in this recorded dataset reported `version: v1`. No V2 NFL subscription was tested. (source: polymarket-market-details-2026.md) (source: poking_around_api/2026-10-06/observations.md)

## Related pages

[[polymarket-nfl-markets]] covers the observed moneyline and total questions. [[polymarket-browser-access]] records the subscription evidence.
