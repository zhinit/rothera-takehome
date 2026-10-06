# Polymarket API probe observations, 2026-10-06

## Scope and status

Completed read-only probes of Gamma REST discovery and direct browser access to the CLOB market WebSocket. These are time-specific observations. They do not establish future event counts or universal access from every origin, region, browser, or network. No application code or backend proxy was created.

## Evidence and reproduction

`requests.json` records exact REST URLs, output filenames, body sizes, and SHA-256 hashes. `requests.md` describes execution, the preliminary failures, and browser requests. `probe-file-origin.html` and `probe-localhost.mjs` preserve the scripts used. `probe-localhost-result.json` contains the complete successful browser result and WebSocket diagnostics. `gamma-*.json` files preserve full API response bodies. `analyze.py` makes no network calls and generated `analysis-result.json` from those saved responses.

The analysis validates array shape and string token IDs. It does not independently verify token ownership on chain. Index-based association is documented by the separately archived official Market Details page.

Official documentation is in `raw/html/` and `raw/md/`. JSON endpoints have no raw HTML response. Their copies in those folders use lossless JSON wrappers. The originals are retained here. Publisher-provided Markdown was saved unchanged for the documentation pages.

## Recorded results

The seven saved offset requests returned counts 100, 100, 100, 100, 100, 52, and 0. The first three pages had no game-shaped slugs. Across the six nonempty pages there were 552 unique events and 44 game-shaped events, one marked ended. The limit-500 request returned 100 events.

Buccaneers versus Cowboys contained 328 markets, one exact-title moneyline and 42 exact full-game O/U questions. Those 43 markets represented 86 outcomes. Team totals and period markets occurred in the same nested array. All selected markets across the 44 game-shaped events had two labels and two distinct decimal-string token IDs, and reported version v1. The completed Dolphins versus Vikings event reported eventClosed false while every selected moneyline and total market was closed.

The successful Chrome check used a localhost origin, returned REST HTTP 200, received WebSocket HTTP 101, and received an array with two book snapshots. Both snapshots carried asset_id, tick_size, and last_trade_price. Only these two moneyline assets were subscribed during this browser probe. Subscription switching, all total-token subscriptions, reconnect behavior, and sustained streaming were not exercised.

## Analysis output

The following is the complete saved output of `python3 analyze.py`.

```json
{
  "pages": [
    {
      "offset": 0,
      "count": 100,
      "gameSlugs": 0,
      "responseBytes": 9441507
    },
    {
      "offset": 100,
      "count": 100,
      "gameSlugs": 0,
      "responseBytes": 2147333
    },
    {
      "offset": 200,
      "count": 100,
      "gameSlugs": 0,
      "responseBytes": 2055769
    },
    {
      "offset": 300,
      "count": 100,
      "gameSlugs": 2,
      "responseBytes": 7006662
    },
    {
      "offset": 400,
      "count": 100,
      "gameSlugs": 41,
      "responseBytes": 39274824
    },
    {
      "offset": 500,
      "count": 52,
      "gameSlugs": 1,
      "responseBytes": 10140504
    },
    {
      "offset": 600,
      "count": 0,
      "gameSlugs": 0,
      "responseBytes": 3
    }
  ],
  "totalEvents": 552,
  "uniqueEventIds": 552,
  "gameCount": 44,
  "endedGames": 1,
  "limit500Returned": 100,
  "invalidMappings": [],
  "games": [
    {
      "slug": "nfl-mia-min-2026-10-04",
      "title": "Dolphins vs. Vikings",
      "ended": true,
      "eventClosed": false,
      "marketCount": 312,
      "moneylineCount": 1,
      "totalCount": 26,
      "selectedClosed": 27,
      "versions": {
        "v1": 27
      }
    },
    {
      "slug": "nfl-tb-dal-2026-10-09",
      "title": "Buccaneers vs. Cowboys",
      "ended": null,
      "eventClosed": false,
      "marketCount": 328,
      "moneylineCount": 1,
      "totalCount": 42,
      "selectedClosed": 0,
      "versions": {
        "v1": 43
      }
    },
    {
      "slug": "nfl-phi-jax-2026-10-11",
      "title": "Eagles vs. Jaguars",
      "ended": null,
      "eventClosed": false,
      "marketCount": 308,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-cin-mia-2026-10-11",
      "title": "Bengals vs. Dolphins",
      "ended": null,
      "eventClosed": false,
      "marketCount": 308,
      "moneylineCount": 1,
      "totalCount": 23,
      "selectedClosed": 0,
      "versions": {
        "v1": 24
      }
    },
    {
      "slug": "nfl-lv-ne-2026-10-11",
      "title": "Raiders vs. Patriots",
      "ended": null,
      "eventClosed": false,
      "marketCount": 327,
      "moneylineCount": 1,
      "totalCount": 42,
      "selectedClosed": 0,
      "versions": {
        "v1": 43
      }
    },
    {
      "slug": "nfl-min-no-2026-10-11",
      "title": "Vikings vs. Saints",
      "ended": null,
      "eventClosed": false,
      "marketCount": 328,
      "moneylineCount": 1,
      "totalCount": 42,
      "selectedClosed": 0,
      "versions": {
        "v1": 43
      }
    },
    {
      "slug": "nfl-cle-nyj-2026-10-11",
      "title": "Browns vs. Jets",
      "ended": null,
      "eventClosed": false,
      "marketCount": 310,
      "moneylineCount": 1,
      "totalCount": 24,
      "selectedClosed": 0,
      "versions": {
        "v1": 25
      }
    },
    {
      "slug": "nfl-ind-pit-2026-10-11",
      "title": "Colts vs. Steelers",
      "ended": null,
      "eventClosed": false,
      "marketCount": 308,
      "moneylineCount": 1,
      "totalCount": 22,
      "selectedClosed": 0,
      "versions": {
        "v1": 23
      }
    },
    {
      "slug": "nfl-hou-ten-2026-10-11",
      "title": "Texans vs. Titans",
      "ended": null,
      "eventClosed": false,
      "marketCount": 307,
      "moneylineCount": 1,
      "totalCount": 22,
      "selectedClosed": 0,
      "versions": {
        "v1": 23
      }
    },
    {
      "slug": "nfl-nyg-was-2026-10-11",
      "title": "Giants vs. Commanders",
      "ended": null,
      "eventClosed": false,
      "marketCount": 327,
      "moneylineCount": 1,
      "totalCount": 42,
      "selectedClosed": 0,
      "versions": {
        "v1": 43
      }
    },
    {
      "slug": "nfl-den-lac-2026-10-11",
      "title": "Broncos vs. Chargers",
      "ended": null,
      "eventClosed": false,
      "marketCount": 307,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-det-ari-2026-10-11",
      "title": "Lions vs. Cardinals",
      "ended": null,
      "eventClosed": false,
      "marketCount": 308,
      "moneylineCount": 1,
      "totalCount": 23,
      "selectedClosed": 0,
      "versions": {
        "v1": 24
      }
    },
    {
      "slug": "nfl-chi-gb-2026-10-11",
      "title": "Bears vs. Packers",
      "ended": null,
      "eventClosed": false,
      "marketCount": 308,
      "moneylineCount": 1,
      "totalCount": 23,
      "selectedClosed": 0,
      "versions": {
        "v1": 24
      }
    },
    {
      "slug": "nfl-sf-sea-2026-10-11",
      "title": "49ers vs. Seahawks",
      "ended": null,
      "eventClosed": false,
      "marketCount": 327,
      "moneylineCount": 1,
      "totalCount": 42,
      "selectedClosed": 0,
      "versions": {
        "v1": 43
      }
    },
    {
      "slug": "nfl-bal-atl-2026-10-12",
      "title": "Ravens vs. Falcons",
      "ended": null,
      "eventClosed": false,
      "marketCount": 327,
      "moneylineCount": 1,
      "totalCount": 42,
      "selectedClosed": 0,
      "versions": {
        "v1": 43
      }
    },
    {
      "slug": "nfl-buf-la-2026-10-13",
      "title": "Bills vs. Rams",
      "ended": null,
      "eventClosed": false,
      "marketCount": 311,
      "moneylineCount": 1,
      "totalCount": 26,
      "selectedClosed": 0,
      "versions": {
        "v1": 27
      }
    },
    {
      "slug": "nfl-sea-den-2026-10-16",
      "title": "Seahawks vs. Broncos",
      "ended": null,
      "eventClosed": false,
      "marketCount": 282,
      "moneylineCount": 1,
      "totalCount": 22,
      "selectedClosed": 0,
      "versions": {
        "v1": 23
      }
    },
    {
      "slug": "nfl-hou-jax-2026-10-18",
      "title": "Texans vs. Jaguars",
      "ended": null,
      "eventClosed": false,
      "marketCount": 283,
      "moneylineCount": 1,
      "totalCount": 23,
      "selectedClosed": 0,
      "versions": {
        "v1": 24
      }
    },
    {
      "slug": "nfl-chi-atl-2026-10-18",
      "title": "Bears vs. Falcons",
      "ended": null,
      "eventClosed": false,
      "marketCount": 301,
      "moneylineCount": 1,
      "totalCount": 42,
      "selectedClosed": 0,
      "versions": {
        "v1": 43
      }
    },
    {
      "slug": "nfl-bal-cle-2026-10-18",
      "title": "Ravens vs. Browns",
      "ended": null,
      "eventClosed": false,
      "marketCount": 281,
      "moneylineCount": 1,
      "totalCount": 22,
      "selectedClosed": 0,
      "versions": {
        "v1": 23
      }
    },
    {
      "slug": "nfl-ten-ind-2026-10-18",
      "title": "Titans vs. Colts",
      "ended": null,
      "eventClosed": false,
      "marketCount": 281,
      "moneylineCount": 1,
      "totalCount": 22,
      "selectedClosed": 0,
      "versions": {
        "v1": 23
      }
    },
    {
      "slug": "nfl-nyj-ne-2026-10-18",
      "title": "Jets vs. Patriots",
      "ended": null,
      "eventClosed": false,
      "marketCount": 282,
      "moneylineCount": 1,
      "totalCount": 22,
      "selectedClosed": 0,
      "versions": {
        "v1": 23
      }
    },
    {
      "slug": "nfl-no-nyg-2026-10-18",
      "title": "Saints vs. Giants",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-car-phi-2026-10-18",
      "title": "Panthers vs. Eagles",
      "ended": null,
      "eventClosed": false,
      "marketCount": 301,
      "moneylineCount": 1,
      "totalCount": 42,
      "selectedClosed": 0,
      "versions": {
        "v1": 43
      }
    },
    {
      "slug": "nfl-pit-tb-2026-10-18",
      "title": "Steelers vs. Buccaneers",
      "ended": null,
      "eventClosed": false,
      "marketCount": 302,
      "moneylineCount": 1,
      "totalCount": 42,
      "selectedClosed": 0,
      "versions": {
        "v1": 43
      }
    },
    {
      "slug": "nfl-ari-la-2026-10-18",
      "title": "Cardinals vs. Rams",
      "ended": null,
      "eventClosed": false,
      "marketCount": 302,
      "moneylineCount": 1,
      "totalCount": 42,
      "selectedClosed": 0,
      "versions": {
        "v1": 43
      }
    },
    {
      "slug": "nfl-lac-kc-2026-10-18",
      "title": "Chargers vs. Chiefs",
      "ended": null,
      "eventClosed": false,
      "marketCount": 282,
      "moneylineCount": 1,
      "totalCount": 22,
      "selectedClosed": 0,
      "versions": {
        "v1": 23
      }
    },
    {
      "slug": "nfl-buf-lv-2026-10-18",
      "title": "Bills vs. Raiders",
      "ended": null,
      "eventClosed": false,
      "marketCount": 282,
      "moneylineCount": 1,
      "totalCount": 23,
      "selectedClosed": 0,
      "versions": {
        "v1": 24
      }
    },
    {
      "slug": "nfl-dal-gb-2026-10-19",
      "title": "Cowboys vs. Packers",
      "ended": null,
      "eventClosed": false,
      "marketCount": 301,
      "moneylineCount": 1,
      "totalCount": 42,
      "selectedClosed": 0,
      "versions": {
        "v1": 43
      }
    },
    {
      "slug": "nfl-was-sf-2026-10-20",
      "title": "Commanders vs. 49ers",
      "ended": null,
      "eventClosed": false,
      "marketCount": 301,
      "moneylineCount": 1,
      "totalCount": 42,
      "selectedClosed": 0,
      "versions": {
        "v1": 43
      }
    },
    {
      "slug": "nfl-ne-chi-2026-10-23",
      "title": "Patriots vs. Bears",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-pit-no-2026-10-25",
      "title": "Steelers vs. Saints",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-sf-atl-2026-10-25",
      "title": "49ers vs. Falcons",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-cin-bal-2026-10-25",
      "title": "Bengals vs. Ravens",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-tb-car-2026-10-25",
      "title": "Buccaneers vs. Panthers",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-nyg-hou-2026-10-25",
      "title": "Giants vs. Texans",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-ind-min-2026-10-25",
      "title": "Colts vs. Vikings",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-mia-nyj-2026-10-25",
      "title": "Dolphins vs. Jets",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-cle-ten-2026-10-25",
      "title": "Browns vs. Titans",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-den-ari-2026-10-25",
      "title": "Broncos vs. Cardinals",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-gb-det-2026-10-25",
      "title": "Packers vs. Lions",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-la-lv-2026-10-25",
      "title": "Rams vs. Raiders",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-kc-sea-2026-10-26",
      "title": "Chiefs vs. Seahawks",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    },
    {
      "slug": "nfl-dal-phi-2026-10-27",
      "title": "Cowboys vs. Eagles",
      "ended": null,
      "eventClosed": false,
      "marketCount": 280,
      "moneylineCount": 1,
      "totalCount": 21,
      "selectedClosed": 0,
      "versions": {
        "v1": 22
      }
    }
  ],
  "nflSportsMetadata": [
    {
      "id": 10,
      "sport": "nfl",
      "name": "NFL",
      "image": "https://polymarket-upload.s3.us-east-2.amazonaws.com/league-icons/nfl-helmet-blue-a1188621.png",
      "resolution": "https://www.nfl.com/",
      "ordering": "away",
      "tags": "1,450,100639",
      "primaryTagId": 450,
      "series": "12185",
      "createdAt": "2025-11-05T19:27:45.399303Z"
    }
  ],
  "sample": {
    "slug": "nfl-tb-dal-2026-10-09",
    "marketCount": 328,
    "selectedMarketCount": 43,
    "outcomeRowCount": 86,
    "selectedQuestions": [
      "Buccaneers vs. Cowboys",
      "Buccaneers vs. Cowboys: O/U 31.5",
      "Buccaneers vs. Cowboys: O/U 33.5",
      "Buccaneers vs. Cowboys: O/U 35.5",
      "Buccaneers vs. Cowboys: O/U 37.5",
      "Buccaneers vs. Cowboys: O/U 39.5",
      "Buccaneers vs. Cowboys: O/U 41.5",
      "Buccaneers vs. Cowboys: O/U 43.5",
      "Buccaneers vs. Cowboys: O/U 45.5",
      "Buccaneers vs. Cowboys: O/U 47.5",
      "Buccaneers vs. Cowboys: O/U 49.5",
      "Buccaneers vs. Cowboys: O/U 51.5",
      "Buccaneers vs. Cowboys: O/U 53.5",
      "Buccaneers vs. Cowboys: O/U 55.5",
      "Buccaneers vs. Cowboys: O/U 57.5",
      "Buccaneers vs. Cowboys: O/U 59.5",
      "Buccaneers vs. Cowboys: O/U 61.5",
      "Buccaneers vs. Cowboys: O/U 63.5",
      "Buccaneers vs. Cowboys: O/U 65.5",
      "Buccaneers vs. Cowboys: O/U 67.5",
      "Buccaneers vs. Cowboys: O/U 69.5",
      "Buccaneers vs. Cowboys: O/U 71.5",
      "Buccaneers vs. Cowboys: O/U 24.5",
      "Buccaneers vs. Cowboys: O/U 26.5",
      "Buccaneers vs. Cowboys: O/U 28.5",
      "Buccaneers vs. Cowboys: O/U 30.5",
      "Buccaneers vs. Cowboys: O/U 32.5",
      "Buccaneers vs. Cowboys: O/U 34.5",
      "Buccaneers vs. Cowboys: O/U 36.5",
      "Buccaneers vs. Cowboys: O/U 38.5",
      "Buccaneers vs. Cowboys: O/U 40.5",
      "Buccaneers vs. Cowboys: O/U 42.5",
      "Buccaneers vs. Cowboys: O/U 44.5",
      "Buccaneers vs. Cowboys: O/U 46.5",
      "Buccaneers vs. Cowboys: O/U 48.5",
      "Buccaneers vs. Cowboys: O/U 50.5",
      "Buccaneers vs. Cowboys: O/U 52.5",
      "Buccaneers vs. Cowboys: O/U 54.5",
      "Buccaneers vs. Cowboys: O/U 56.5",
      "Buccaneers vs. Cowboys: O/U 58.5",
      "Buccaneers vs. Cowboys: O/U 60.5",
      "Buccaneers vs. Cowboys: O/U 62.5",
      "Buccaneers vs. Cowboys: O/U 64.5"
    ],
    "excludedTeamTotals": [
      "Buccaneers Team Total: O/U 10.5",
      "Buccaneers Team Total: O/U 12.5",
      "Buccaneers Team Total: O/U 13.5",
      "Buccaneers Team Total: O/U 16.5",
      "Buccaneers Team Total: O/U 19.5",
      "Buccaneers Team Total: O/U 20.5",
      "Buccaneers Team Total: O/U 23.5",
      "Buccaneers Team Total: O/U 26.5"
    ],
    "excludedPeriods": [
      "1H Spread: Buccaneers (-1.5)",
      "1H Spread: Buccaneers (-2.5)",
      "1H Spread: Buccaneers (-3.5)",
      "1H Spread: Buccaneers (-4.5)",
      "1H Spread: Buccaneers (-5.5)",
      "1H Spread: Buccaneers (-6.5)",
      "1H Spread: Buccaneers (-7.5)",
      "1H Spread: Buccaneers (-8.5)"
    ],
    "moneyline": [
      {
        "id": "3951230",
        "question": "Buccaneers vs. Cowboys",
        "conditionId": "0xd43898f7e10c30da1adf9c23c808fc8861ec7c0a53195e4a187c199a9b19f376",
        "version": "v1",
        "outcomes": "[\"Buccaneers\", \"Cowboys\"]",
        "clobTokenIds": "[\"41073895388163492044683513841262626450248745686629069268834561009386173172680\", \"66616602105135321479456151494379932980062039030841962258728108349184895983957\"]"
      }
    ]
  },
  "browser": {
    "checkedAt": "2026-10-06T17:18:33.882Z",
    "origin": "http://127.0.0.1:63904",
    "gamma": {
      "status": 200,
      "count": 100
    },
    "websocket": "received",
    "handshakeStatuses": [
      101
    ],
    "frameType": "list",
    "books": [
      {
        "asset_id": "41073895388163492044683513841262626450248745686629069268834561009386173172680",
        "event_type": "book",
        "bestBid": 0.19,
        "bestAsk": 0.2,
        "tick_size": "0.01",
        "last_trade_price": "0.190"
      },
      {
        "asset_id": "66616602105135321479456151494379932980062039030841962258728108349184895983957",
        "event_type": "book",
        "bestBid": 0.8,
        "bestAsk": 0.81,
        "tick_size": "0.01",
        "last_trade_price": "0.190"
      }
    ]
  }
}

```
