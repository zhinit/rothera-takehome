# CLOB source retrieval record

Approved sources were retrieved on 2026-10-06. The complete source catalog, pinned SDK commit, original URLs, archive filenames, formats, and SHA-256 hashes are in [the catalog](../../../docs/clob-websocket-source-catalog.json).

Official documentation HTML and publisher-provided Markdown were fetched separately. The JSON specification was fetched in full and enclosed without alteration in Markdown and generated HTML wrappers. SDK TypeScript files were fetched from raw.githubusercontent.com at commit `d36b9df37b8562887aadad78b063bb84550eb343`, with their full GitHub HTML pages fetched separately. No archived source files were overwritten.

The blog page serves an HTML shell with its article embedded as a JavaScript template literal in `/assets/index-8W8W0-Np.js`. The archive preserves the complete HTML shell and bundle. [extract-blog.py](extract-blog.py) reproduces the extraction logic used in the successful inline Python command. It decodes string escapes without executing JavaScript and prints the complete article, including frontmatter. Its output was verified byte-for-byte against `raw/md/zhinit-kalshi-polymarket-arbitrage-2026.md`.

Reproduce that extraction offline with:

```sh
python3 raw/source_retrieval/2026-10-06-clob-websocket/extract-blog.py
```

The request command form was `curl -L --fail -sS '<source URL>' -o '<temporary path>'`. For official documentation, the HTML source URL also has a `.md` counterpart. For the SDK, the raw source URL substitutes `raw.githubusercontent.com` and removes `/blob/` from the pinned GitHub URL. The blog bundle URL is recorded separately in the catalog. Sources were first fetched into `/private/tmp` and then saved to new archive files. No response headers or full execution transcript were saved for these source downloads. The detailed direct-API execution record remains in `raw/poking_around_api/2026-10-06-clob-websocket/`.
