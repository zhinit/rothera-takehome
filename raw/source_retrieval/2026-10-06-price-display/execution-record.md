# Conversion verification on 2026-10-06

The actual converter version, obtained with `pandoc --version`, was:

```text
pandoc 3.11
Features: +server +lua
Scripting engine: Lua 5.4
```

The earlier README incorrectly labels the version as 3.8.3. That immutable file remains unchanged. The version above corrects that metadata. The conversion script reproduced `raw/md/w3c-css-animations-full-2026.md` byte-for-byte with Pandoc 3.11.

Verification read all HTML and Markdown archive bytes and compared their SHA-256 hashes against `docs/price-display-source-catalog.json`. All nine pairs matched. It reran the saved Python capture analyzer and Node numeric experiment and compared parsed JSON against their original saved stdout. Both matched. No raw file was rewritten by verification, no network probe was run, and no wiki linter was invoked.
