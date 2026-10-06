# ROTHERA

A frontend engineering take-home project: a React, TypeScript, and Vite dashboard for live NFL prediction markets on Polymarket. Select an active game to view moneyline and all full-game over/under prices, streamed directly from Polymarket’s public APIs.

## Run locally

Use Node.js 22.12+ (or a newer supported release).

```sh
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite. No API keys or environment variables are needed.
The browser calls Gamma REST and the CLOB WebSocket directly. Vite only serves
the frontend application. An internet connection and access to Polymarket are required.

## Verify

```sh
cd frontend
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

With the development server running, `npm run test:browser` launches headless
Chrome for a live smoke test. Its default Chrome path is for macOS. Set
`CHROME_PATH` for another installation and `DEMO_URL` for another local server
URL. The test writes desktop/mobile screenshots and a JSON report to a printed
temporary directory. It requires at least two active games and network access.

`npm run preview` serves the production build locally.

`npm run format` applies Prettier to the frontend. Formatting excludes dependencies,
build output, coverage, and the generated lockfile. ESLint checks code quality separately.

## Implementation

- Walks all Gamma NFL event pages, then selects active game events and exact
  moneyline/full-game total questions. Each token gets its own table row.
- A single socket changes subscriptions when the selected game changes, sends
  ten-second heartbeats, and reconnects with fresh snapshots after disconnects.
  Incomplete initial snapshots trigger recovery after 15 seconds, even when
  heartbeats are still arriving.
- Zustand selectors subscribe individual price cells to their price and tick.
  Changes flash green or red for 500 ms, restarting on each subsequent change.
- Supports empty, loading, error, reconnecting, and missing-price states, with a
  responsive game selector and horizontally scrollable price columns.

See [implementation decisions and verification](docs/implementation.md),
[the research wiki](wiki/index.md), and [AI usage disclosure](docs/ai-usage.md).

See [the assignment](Engineering_Take_Home_Assignment_-_Front_End.md) for requirements.
