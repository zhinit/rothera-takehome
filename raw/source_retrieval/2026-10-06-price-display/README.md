# CSS full-source conversion

The original fetched CSS HTML is preserved byte-for-byte in `raw/html/w3c-css-animations-full-2026.html`, identical to `raw/html/w3c-css-animations-2026.html`. Pandoc's first conversion selected only the main content. Both initial files remain unchanged. The separate full conversion retains front matter, navigation, document content, indexes, and references.

Reproduce the full conversion from the repository root without changing any archive:

```sh
python3 raw/source_retrieval/2026-10-06-price-display/convert-css.py
```

Conversion used Pandoc 3.8.3 on 2026-10-06. The script changes only `main` element tags to `div` for conversion so that Pandoc processes the full body. The preserved fetched HTML is unmodified. Archive URLs, format descriptions, and SHA-256 hashes are in `docs/price-display-source-catalog.json`. No new source fetch is needed to reproduce the conversion.
