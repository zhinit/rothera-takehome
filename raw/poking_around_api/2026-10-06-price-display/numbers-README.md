# Synthetic JavaScript numeric experiments

Run on 2026-10-06 from the repository root:

```sh
node raw/poking_around_api/2026-10-06-price-display/numbers.mjs
```

Exact stdout is preserved in `numbers-result.json`, including Node version, platform, inputs, and results. This run demonstrates empty and null coercion, non-finite inputs, decimal subtraction artifacts, logarithms for non-power-of-ten ticks, and the difference between formatting decimal places and rounding to a tick grid. No API request, application implementation, timer measurement, or browser animation test was performed.

The field named `equalWidthsWithDifferentFloatingResults` contains candidate examples that both returned equal floating results. These candidates did not demonstrate unequal results for equal mathematical widths. The output is preserved as produced, and no such claim is made from that field. The spread examples do demonstrate deviation from exact decimal subtraction. Completed run files are immutable.
