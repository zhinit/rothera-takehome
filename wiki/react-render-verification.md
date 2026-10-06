# Verifying React render isolation

## Notifications, renders, and commits

An external store notification causes React to check its snapshot and render if that snapshot changes according to `Object.is`. A notification therefore does not itself prove that the component rendered. A render also does not prove that the DOM changed. React can call a component and discard its result. The Profiler reports committed subtree updates and their rendering timings. (source: react-use-sync-external-store-2026.md) (source: react-memo-2026.md) (source: react-profiler-2026.md)

Components may also render because of parent props, their own state, or context. `memo` compares props but does not suppress updates to a component's own state or consumed context. (source: react-memo-2026.md)

## Observing unrelated rows

Component function instrumentation records render invocations, while a Profiler callback records committed updates within its subtree. Under an isolated update to one record, unchanged selected snapshots do not cause store-triggered renders in unrelated subscribers. Parent updates, local state, and context are additional render triggers. These distinctions follow from the external-store API, memo behavior, and Profiler scope. (source: react-use-sync-external-store-2026.md) (source: react-memo-2026.md) (source: react-profiler-2026.md)

`act` flushes pending React updates before test assertions. React documents its awaited asynchronous form. A configured React test environment is required. React Testing Library's helpers wrap `act`, and its environment sets `IS_REACT_ACT_ENVIRONMENT`. (source: react-act-2026.md)

## Profiler interpretation

`onRender(id, phase, actualDuration, baseDuration, startTime, commitTime)` identifies a committed profiled subtree, distinguishes mount/update phases, and reports timing. `actualDuration` measures the current render work. `baseDuration` estimates a render without the subtree's optimizations. Shared `commitTime` values can group observations from nested profilers. React DevTools provides an interactive Profiler. (source: react-profiler-2026.md)

A profiler around a row includes descendant updates. Its callback can reflect a price cell update without demonstrating that the row function itself ran. An unchanged DOM value alone is insufficient evidence of zero render work. These are distinctions inferred from the subtree scope of Profiler and React's render behavior. (source: react-profiler-2026.md) (source: react-memo-2026.md)

## StrictMode and production measurements

StrictMode deliberately calls render functions extra times in development and exercises effect and ref cleanup. Initial render counts in development therefore include additional invocations that do not occur in production. (source: react-strict-mode-2026.md)

StrictMode's extra cleanup cycles expose missing subscription cleanup. React's memo documentation specifies production mode for performance measurements. Programmatic profiling is disabled in standard production builds, so collecting Profiler timings in production mode requires a special profiling build. An empty callback log in a standard production build does not establish isolation. (source: react-strict-mode-2026.md) (source: react-memo-2026.md) (source: react-profiler-2026.md)

## Performance beyond render counts

For a shared Zustand store, the archived implementation visits registered listeners after a changed state update. Unrelated components can avoid rendering while still checking selectors. Cell subscriptions can reduce rendering scope while increasing listener work. This tradeoff is inferred from the implementation, with no benchmark result established here. (source: zustand-vanilla-implementation-2026.md) (source: zustand-react-implementation-2026.md) (source: react-profiler-2026.md)

## Related pages

[[zustand-streaming-state]] explains selector and update patterns that support isolation.
