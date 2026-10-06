# React connection lifecycle source catalog

## Archived sources

Retrieved on 2026-10-06. React sources retain full rendered HTML and the official repository Markdown fetched directly. The WebSockets Standard retains full original HTML and a full Markdown conversion. Retrieval URLs, formats, sizes, and SHA-256 hashes are recorded in [the source manifest](react-connection-lifecycle-source-catalog.json).

| Source | Upstream | Markdown archive |
| --- | --- | --- |
| React useEffect | [React](https://react.dev/reference/react/useEffect) | [Archive](../raw/md/react-use-effect-2026.md) |
| Lifecycle of Reactive Effects | [React](https://react.dev/learn/lifecycle-of-reactive-effects) | [Archive](../raw/md/react-effect-lifecycle-2026.md) |
| Synchronizing with Effects | [React](https://react.dev/learn/synchronizing-with-effects) | [Archive](../raw/md/react-synchronizing-effects-2026.md) |
| React useRef | [React](https://react.dev/reference/react/useRef) | [Archive](../raw/md/react-use-ref-2026.md) |
| Separating Events from Effects | [React](https://react.dev/learn/separating-events-from-effects) | [Archive](../raw/md/react-separating-events-effects-2026.md) |
| React useEffectEvent | [React](https://react.dev/reference/react/useEffectEvent) | [Archive](../raw/md/react-use-effect-event-2026.md) |
| WebSockets Standard | [WHATWG](https://websockets.spec.whatwg.org/) | [Full archive](../raw/md/whatwg-websockets-standard-full-2026.md) |

The initial immutable `whatwg-websockets-standard-2026` conversion contains only the main element because Pandoc selected it automatically. A separate `whatwg-websockets-standard-full-2026` archive includes the title, abstract, indexes, and references. Its conversion used a temporary copy with `main` tags replaced by `div` tags. The original HTML and initial conversion remain unchanged. Wiki citations use the full archive.

## Existing evidence reused

The topic page also cites already archived React StrictMode and useSyncExternalStore documentation, Polymarket Real-Time Data and AsyncAPI documentation, the official SDK lifecycle, market manager, and subscription protocol sources, and the saved [CLOB browser probe](../raw/poking_around_api/2026-10-06-clob-websocket/README.md). Those archives were not changed.

## Research scope

Findings are collected in [Connection lifecycle in React](../wiki/react-connection-lifecycle.md). Derived techniques are identified as inferences. No application code, new API probes, or benchmarks were produced in this research pass.
