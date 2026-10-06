# Polymarket price correctness and display

## Tick increments and decimal precision

The CLOB OpenAPI defines tick size as the minimum price increment. The archived TypeScript CLOB client rounding configuration maps the following ticks to price decimal places. This is SDK order-building configuration, not a guarantee that every market uses each tick or a specification of dashboard formatting. (source: polymarket-clob-openapi-2026.md) (source: polymarket-sdk-rounding-config-2026.md)

| Tick | Price decimal places |
| --- | --- |
| `0.1` | 1 |
| `0.01` | 2 |
| `0.005` | 3 |
| `0.0025` | 4 |
| `0.001` | 3 |
| `0.0001` | 4 |

Decimal precision and tick-grid membership are distinct. In a synthetic JavaScript experiment, `(0.503).toFixed(3)` retained `"0.503"`, which is not a multiple of `0.005`. The logarithms of `0.005` and `0.0025` did not produce integer decimal-place counts. A rule based solely on `-log10(tick)` therefore does not cover the SDK's full tick configuration. These are numeric deductions and experiments, not observations of off-grid exchange quotes. (source: ecmascript-numbers-dates-2026.md) (source: polymarket-sdk-rounding-config-2026.md) (source: poking_around_api/2026-10-06-price-display/numbers-result.json)

The saved NFL capture contained 414 snapshots with tick `0.01` and 16 with `0.001`. It contained no `tick_size_change` event. The WebSocket specification documents per-asset `old_tick_size` and `new_tick_size` fields. A formatting dependency can change independently of a price value, but these sources do not require rewriting a historical trade price onto a new tick grid. Live transitions and non-power-of-ten ticks were not observed in this sample. (source: poking_around_api/2026-10-06-price-display/analysis-result.json) (source: polymarket-clob-asyncapi-2026.md)

## Best quotes and conflicting array ordering

The pricing guide describes bids ascending and asks descending, with best quotes at the end. The OpenAPI `OrderBookSummary` descriptions say bids descending and asks ascending. This is an explicit documentation contradiction. The saved browser example has ascending bids and descending asks. Numeric maximum bid and minimum ask produce the best quotes independently of these orderings. That conclusion follows from the definition of best quotes, rather than an assumption about array position. (source: polymarket-prices-order-books-2026.md) (source: polymarket-clob-openapi-2026.md) (source: poking_around_api/2026-10-06-price-display/analysis-result.json) (source: polymarket-prices-orderbook-concepts-2026.md)

For `price_change` messages, `price` describes the changed book level and `best_bid` and `best_ask` are separate fields on each asset item. The specification does not list those best-quote fields as required, although all 982 captured delta items included them. Presence in this sample does not establish universal availability. (source: polymarket-clob-asyncapi-2026.md) (source: poking_around_api/2026-10-06-clob-websocket/analysis-result.json) (source: poking_around_api/2026-10-06-price-display/analysis-result.json)

## Spread arithmetic and formatting

Spread is best ask minus best bid. It is distinct from Polymarket's headline price, which the concepts guide describes as a midpoint or, for a spread wider than $0.10, the last traded price. (source: polymarket-prices-order-books-2026.md) (source: polymarket-prices-orderbook-concepts-2026.md)

ECMAScript `Number` uses IEEE 754 binary64 arithmetic. The synthetic run produced `0.010000000000000009` for `0.51 - 0.50` and `0.0024999999999999467` for `0.5025 - 0.5000`. `toFixed` returned `"0.0100"` and `"0.0025"` at four decimal places. This illustrates formatting a floating result, without establishing exact internal decimal arithmetic. `toFixed` rounds the existing Number and returns a string, including textual non-finite values for non-finite inputs. (source: ecmascript-data-types-2026.md) (source: ecmascript-numbers-dates-2026.md) (source: poking_around_api/2026-10-06-price-display/numbers-result.json)

Aligned decimal strings can alternatively be represented as scaled integers and subtracted exactly while the integers remain within the representable safe range. This is a deduction from integer representability, not a selected project implementation. Arithmetic representation, decimal-place formatting, and tick-grid rounding are separate operations. Subtracting already rounded display values can lose information present in the original quotes. (source: ecmascript-data-types-2026.md) (source: ecmascript-numbers-dates-2026.md)

Equal known bid and ask give a zero spread. An ask below the bid gives a negative arithmetic result, as the synthetic `0.49 - 0.50` example demonstrates. Clamping it to zero changes the derived value. The sources examined do not prescribe a dashboard policy for crossed quotes. (source: polymarket-prices-order-books-2026.md) (source: poking_around_api/2026-10-06-price-display/numbers-result.json)

## Empty sides and unavailable quote values

The OpenAPI permits bid and ask arrays without a minimum item count. An empty side has no price over which to take an extremum. Consequently, the arithmetic definition of spread has no pair of best quotes when either side is empty. A placeholder, retained prior quote, or boundary number would add a display policy beyond that definition. (source: polymarket-clob-openapi-2026.md) (source: polymarket-prices-order-books-2026.md)

None of the 430 saved snapshots had an empty bid or ask side. None of the 982 delta items had a missing, null, empty, or numeric `0`/`1` best quote. The examined wire schema defines best quotes as strings and does not explain an empty-side sentinel. This research therefore establishes neither `0` as an empty bid sentinel nor `1` as an empty ask sentinel. Missing fields and explicit empty values cannot be assumed to mean the same thing. (source: poking_around_api/2026-10-06-price-display/analysis-result.json) (source: polymarket-clob-asyncapi-2026.md)

## Missing last trade prices

Of the 430 captured snapshots, 262 had `last_trade_price: ""` and 168 had numeric strings. These counts include repeated snapshots and parallel connections. The complete saved example with an empty trade seed still has both bid and ask levels. An unavailable last-trade seed therefore occurs with a populated book in this sample. It does not independently prove that the token has never traded. No trade execution event arrived during the capture. (source: poking_around_api/2026-10-06-price-display/analysis-result.json)

The REST `/last-trade-price` endpoint documents the no-trade response as `{"price":"0.5","side":""}`. The pricing guide's REST example describes a never-traded token with an empty book, while the OpenAPI description specifies the default whenever no trades are found. The same guide says the unified TypeScript SDK returns `null`, the Python SDK returns `None`, and never-traded outcomes are omitted from the batch response. These contracts belong to their named interfaces. They do not establish that a WebSocket snapshot containing numeric `"0.5"` is a missing trade. (source: polymarket-clob-openapi-2026.md) (source: polymarket-prices-order-books-2026.md)

The synthetic JavaScript run converted `""`, whitespace, and `null` to numeric zero. All three passed `Number.isFinite` after conversion. It also converted `"0.50"` and `"0.500"` to the same number. Numeric conversion and a subsequent finite check alone cannot distinguish an absent trade from a supplied zero price. Missing-value handling must precede conversion to preserve that distinction. This is a language-level conclusion, not a claim that numeric zero is an exchange sentinel. (source: poking_around_api/2026-10-06-price-display/numbers-result.json)

## Related pages

[[polymarket-clob-websocket]] covers wire envelopes and feed lifecycle. [[price-cell-flashes]] covers repeated change indicators. [[zustand-streaming-state]] covers subscriptions to price and formatting inputs.
