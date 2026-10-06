# AI usage

## 2026-10-06

- GPT-6 (Codex): Removed the redundant subtitle beneath Market prices and its unused wrapper and styles.

- GPT-6 (Codex): Removed the market table's fixed minimum width, allowed content-sized columns, and tightened cell padding in narrow panels to improve split-screen layouts while preserving the sidebar's original breakpoint.

- GPT-6 (Codex): Narrowed the Outcome column after removing redundant descriptions. Following visual feedback and browser inspection, reduced it to 180 px and centered price headers and values to reduce the apparent gap before the first price.

- GPT-6 (Codex): Removed repeated matchup descriptions from game winner and over/under rows, retained outcome names and point lines, removed unused styles, and adjusted the browser smoke text-size check.

- GPT-6 (Codex): Adapted the dark theme to navy and bright blue from ROTHERA's official stylesheet, retained separate green bid and red ask colors, and updated theme metadata and browser smoke expectations. Passed all 28 tests and live desktop/mobile browser checks, inspected both screenshots, and verified text contrast across the main surfaces (minimum 5.21:1).

- GPT-6 (Codex): Downloaded the official header logo and favicon linked by [ROTHERA's website](https://www.rothera.io/), replaced the generated logo with these local assets, and sized the header image for desktop and mobile.

- GPT-6 (Codex): Grouped the table legend indicators, then removed all three indicators, their footer, and unused styles at the user's request.

- GPT-6 (Codex): Replaced user-facing moneyline and totals terminology with Game Winner and Over/Unders across table labels, empty states, accessible captions, and page metadata. Expanded O/U in displayed market questions.

- GPT-6 (Codex): Aligned the matchup title and Polymarket link in one row and removed the title's extra top spacing.

- GPT-6 (Codex): Renamed the connected feed heading to Live Feed for Selected Matchup, removed the duplicate label inside the card, allowed the longer heading to wrap on mobile, and updated browser smoke expectations.

- GPT-6 (Codex): Moved the live feed status from the header to a larger heading directly above the selected matchup card, with responsive sizing and the existing connection states preserved.

- GPT-6 (Codex): Simplified the header branding to the existing logo and ROTHERA, removing the Markets label, divider, NFL badge, and their unused styles.

- GPT-6 (Codex): Replaced the footer's data source and timezone copy with the user's exact wording.

- GPT-6 (Codex): Removed the NFL markets page title, description, and FOOTBALL / NFL label at the user's request. Deleted their wrapper and unused styles.

- GPT-6 (Codex): Removed the sidebar Polymarket attribution and heading tagline, replaced the dashboard description with the requested copy, and simplified the active NFL markets heading while retaining its live count. Removed the unused styles.

- GPT-6 (Codex): Added Prettier with frontend-only formatting and verification scripts. Inspected the user's website stylesheet and matched its dark palette and fonts, increasing table text sizes and contrast. Added a 15-second initial-snapshot deadline, reconnect backoff that persists when snapshots remain incomplete, and four lifecycle tests. Updated the browser smoke assertions and project documentation. No subagents or other AI models were used.

- GPT-6 (Codex): Built the React, TypeScript, Vite, and Zustand dashboard from the assignment and existing research. Implemented direct Gamma event discovery, validated CLOB message parsing, subscription and reconnect handling, cell-level subscriptions, tick-aware prices, repeated 500 ms flashes, and responsive UI states. Wrote automated parsing, state, lifecycle, render-isolation, and UI tests, plus a dependency-free Chrome smoke script. Ran lint, type checking, tests, production builds, and live browser verification. Updated project documentation. No subagents or other AI models were used for this implementation.

- GPT-6 (Codex): Reviewed the assignment and existing research for price correctness and display. Discovered official Polymarket pricing documentation and SDK rounding configuration, ECMAScript numeric and formatting specifications, and browser timer and CSS animation specifications. Proposed sources for tick precision, spreads, empty quotes, missing trades, and repeated 500 ms flashes. Source archiving and wiki ingestion await approval. No application code was implemented.

- GPT-6 (Codex): After source approval, archived eight primary sources for price correctness and repeated flashes, with the SDK rounding configuration pinned to a commit. Added a separate full CSS conversion after identifying front matter omitted by the initial conversion, preserving both versions. Discussed findings, added two cited topic pages, documented the order-book ordering contradiction and interface-specific missing-trade contracts, and preserved reproducible offline capture analysis and synthetic JavaScript numeric experiments. Updated the wiki index, log, source catalog with hashes, and related links. No application code, UI policy, new live probe, or browser flash experiment was implemented.

- GPT-6 (Codex): Reviewed the assignment and existing streaming-state and WebSocket research, discovered and archived seven approved official React and WHATWG sources, read the sources, and discussed findings before adding a cited connection-lifecycle wiki page. Recorded ownership, cleanup, duplicate-connection mechanisms, Effect Event restrictions, stale-message checks, and limits during rapid game switches. Preserved an initial main-only WHATWG conversion and added a separate full conversion without changing immutable archives. Updated the source catalog, wiki links, index, and log. No application code, new probes, or benchmarks were produced.

- GPT-6 (Codex): Inspected the assignment and existing WebSocket research, discovered current official sources, and ran direct headless Chrome CLOB probes for snapshot fields, deltas, subscription switching, initial dumps, heartbeats, and clean-close reconnects. Preserved the exact successful scripts, full captures, offline analysis, execution record, and limitations in `raw/poking_around_api/2026-10-06-clob-websocket/` following the user's request for reproducible evidence. After source approval, archived the full Real-Time Data page, AsyncAPI specification, four official SDK source files pinned to a commit, and the identified blog article. Preserved and verified reproducible extraction of the blog's full Markdown from its JavaScript bundle. Added the cited CLOB topic page, reconciled the article's blanket snapshot description with observed deltas and the assignment, and recorded source hashes and verification limits. No application code was implemented.

- GPT-6 (Codex): Researched Polymarket Gamma pagination, NFL filtering, market identification, and outcome-token mapping. Archived six approved official documentation pages and full live response snapshots, ran read-only REST and headless Chrome browser probes, preserved scripts, requests, results, and offline analysis in `raw/poking_around_api/2026-10-06/`, and wrote four cited wiki pages. No application code was implemented.

- GPT-6 (Codex): Reviewed the assignment and researched Zustand selectors, row and cell subscriptions, and React rerender verification. After source approval, archived 13 official sources, read their full contents, discussed findings, added two cited wiki topic pages, and collected subscription and render-verification information. Removed project recommendations and the proposed implementation plan after the user clarified that research should only collect information. No application code was implemented or benchmarked.

- GPT-6 (Codex): Updated the shared research workflow to preserve probe scripts, requests, results, and failures in dated raw subfolders and cite that evidence.
