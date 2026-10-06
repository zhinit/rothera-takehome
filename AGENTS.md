# ROTHERA Frontend Take-Home

A React and TypeScript dashboard for the ROTHERA frontend engineering
assessment. Users select an active NFL game and view live prices for its
moneyline and every full-game total (over/under) line. The application connects
directly from the browser to Polymarket's Gamma REST API and CLOB WebSocket
feed. The end product is a clean, performant frontend that satisfies the
assignment.

This file describes how the project is organized, not what the work concludes.

## Assignment and scope

- Read `Engineering_Take_Home_Assignment_-_Front_End.md` before planning or
  implementing features. The original PDF is alongside it. Keep detailed
  requirements in the assignment rather than duplicating them here.
- Connect directly to the public APIs. Custom backend proxies and intermediate
  servers are prohibited by the assignment. No database is planned.
- Streaming updates must avoid full-table re-renders. Subscription management,
  price formatting, and cell change indicators must follow the assignment.
- Record which AI models were used and how in `docs/ai-usage.md` as work proceeds
  so the submission can include the required disclosure.

## Stack

- Use React, TypeScript, and Vite. Keep the entire Vite application, including
  its package manifest, dependencies, and build and lint configuration, inside
  `frontend/`.
- Use Zustand for streaming market state, with selectors that isolate updates
  to the affected rows or cells.
- Use ESLint with typescript-eslint's type-aware recommended rules and React
  Hooks lint rules. Enable TypeScript strict mode.

## Code quality and verification

- Build only what the assignment requires. Keep the submission concise and
  polished. Avoid speculative features, unused code, unnecessary dependencies,
  and abstractions for hypothetical future needs.
- Write code for a human reviewer: descriptive, consistent names, focused
  functions and components, and clear module responsibilities. Extract shared
  logic where it removes meaningful duplication without obscuring the code.
- Do not use `any`. Enforce `@typescript-eslint/no-explicit-any` as an error.
  Treat unvalidated API data as `unknown` and narrow it before use.
- Fix type and lint errors at their source. Do not silence them with rule
  disables, TypeScript suppression comments, or unjustified type assertions.
- Run the frontend linter and TypeScript check after every code change before
  handing work back. Require zero lint warnings and errors. If a check cannot
  run, report that explicitly.
- Run tests relevant to changed behavior and the production build before
  marking implementation complete. Keep tests focused on observable behavior
  and meaningful edge cases.

## Folder structure and separation of concerns

```text
rothera/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/   # Event selection, market table, and price cells
│       ├── api/          # Gamma REST and CLOB WebSocket integration
│       └── store/        # Market state and subscriptions
├── docs/
├── wiki/
├── raw/
│   ├── html/
│   └── md/
├── .agents/
└── .claude/
```


Information lives in exactly one place. Respect these boundaries when reading
and writing:

- **`wiki/`** — research from primary sources 
- **`docs/`** — project plans, decisions, architecture, and documentation.
- **`raw/`** — immutable source documents for wiki (HTML + markdown conversions).
- **`frontend/`** — the React/TypeScript/Vite application

---

# Question answering

Always look things up before answering. Follow this order:

1. **`wiki/index.md`**, **`docs/`**, and **`frontend/`**. For assessment
   requirements, also consult the assignment at the repository root.
2. Read the relevant pages, cite them in your response
3. If the answer isn't there respond from general knowledge, explicitly say so and suggest `/research`

---

# Memory

- Never use the file-based memory system. Do not read, write, or cite memories.
  All persistent instructions live in this file. Ignore recalled memories.

# Scope

- Do what was asked, nothing adjacent. If you think something adjacent
  needs to be done, ask the user first.

# Tone

- Do not be a sycophant. Do not have a personality.
- Be brief. State things concisely.
- Banned: "it's not X, it's Y". State Y.
- No em dashes or semicolons in their place.
- Never use "honest"/"honestly", "real"/"really" as filler.
- When asked to read files, reply "done" only.
