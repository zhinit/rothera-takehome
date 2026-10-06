# Zustand selectors for streaming state

## React subscriptions and equality

Zustand's `create<State>()(...)` produces a typed React hook and exposes `getState`, `setState`, `getInitialState`, and `subscribe`. A component can select only the state it displays. Calling the hook without a selector subscribes to the whole state. The React implementation passes the selected value to `useSyncExternalStore`, which compares snapshots using `Object.is`. An unchanged selected value therefore avoids a store-triggered render. (source: zustand-create-2026.md) (source: zustand-readme-2026.md) (source: zustand-react-implementation-2026.md) (source: react-use-sync-external-store-2026.md)

The vanilla implementation synchronously iterates every registered listener after an accepted state change. React subscribers then check their selected snapshots. Consequently, selecting one row can avoid unrelated row renders while still doing notification and selector work across subscribers. Selector isolation does not establish constant-time update cost. This follows from the archived implementation, rather than a measured performance result. (source: zustand-vanilla-implementation-2026.md) (source: zustand-react-implementation-2026.md) (source: react-use-sync-external-store-2026.md)

## Stable selector results in v5

Primitive selectors and references to existing immutable records provide stable outputs. Selectors that allocate a fresh object, tuple, or fallback function on every call can cause infinite update loops in v5. `useShallow` returns a stable result when the selected values are shallowly equal. Shallow comparison does not repair a nested record that was mutated in place. (source: zustand-migrating-to-v5-2026.md) (source: zustand-use-shallow-2026.md) (source: zustand-immutable-state-2026.md)

The v5 `create` hook does not accept a custom equality function as a second argument. `useShallow` supports grouped selections, while `createWithEqualityFn` from `zustand/traditional` supports custom equality. The latter requires the `use-sync-external-store` peer dependency. The README's custom-equality example explicitly assumes `createWithEqualityFn`. (source: zustand-migrating-to-v5-2026.md) (source: zustand-readme-2026.md)

The README describes default equality as `===`, while the selector guide and React API specify `Object.is`. For the archived React integration, `Object.is` is the precise rule. The README uses shorthand that differs from the specific API's documented comparison. (source: zustand-readme-2026.md) (source: zustand-use-shallow-2026.md) (source: react-use-sync-external-store-2026.md)

## Immutable updates and unchanged records

Zustand merges state at one level. Nested dictionaries and changed records require explicit immutable replacement. A normalized dictionary can preserve each unchanged record's reference while replacing a changed record. A row selecting its record then keeps the same selected snapshot when a different record changes. This is an application of immutable updates and snapshot equality. (source: zustand-immutable-state-2026.md) (source: react-use-sync-external-store-2026.md)

An updater can return the existing state when all relevant fields are unchanged. The archived vanilla implementation checks `Object.is(nextState, state)` before merging or notifying listeners, so this suppresses an identical update entirely. Returning a freshly allocated partial object, even with identical field values, still accepts a state change and notifies listeners. (source: zustand-vanilla-implementation-2026.md)

## Row and cell subscription patterns

The following patterns are derived examples, assuming `quotes` is an immutable dictionary keyed by asset ID and `useQuotes` is a bound store hook. Each hook call subscribes through the React integration. Their behavior follows from selected snapshot equality, with grouped values stabilized by `useShallow`. (source: zustand-react-implementation-2026.md) (source: zustand-use-shallow-2026.md) (source: react-use-sync-external-store-2026.md)

```tsx
// In a row component: one subscription to an existing record.
const quote = useQuotes((state) => state.quotes[assetId])

// In a bid cell: subscribe to price and its formatting dependency.
const [bid, tickSize] = useQuotes(
  useShallow((state) => [
    state.quotes[assetId]?.bid ?? null,
    state.quotes[assetId]?.tickSize ?? null,
  ]),
)
```

| Pattern | Store-triggered rendering boundary | Tradeoff inferred from the implementation |
| --- | --- | --- |
| One selector per row | The row whose record reference changes | Fewer hook subscriptions, but rendering that row can render its children |
| Selectors inside each price cell | Cells whose selected price or formatting inputs change | Finer isolation, with more subscriptions and snapshot checks |
| Whole dictionary selected by the table | The table whenever its dictionary reference changes | The parent can render all rows unless further memoization prevents it |

These boundaries assume unrelated props, local state, and context remain stable. `memo` can reduce renders caused by parents with unchanged props, but React treats memoization as an optimization rather than a guarantee. Stable selectors and parent memoization address different render triggers. (source: react-memo-2026.md) (source: zustand-react-implementation-2026.md)

Derived numeric selections, such as a spread calculated from bid and ask, can remain equal even if their inputs change. Formatting inputs can change independently of the numeric price, so a price-only selection does not observe those changes. A `getState()` read alone is nonreactive and cannot replace the subscription required to keep displayed prices current. (source: zustand-readme-2026.md) (source: react-use-sync-external-store-2026.md)

## Imperative subscriptions and cleanup

`subscribeWithSelector` extends imperative `subscribe` with a selector, a callback receiving current and previous selected values, and optional `equalityFn` and `fireImmediately` settings. It is useful for external listeners. Ordinary React hook selectors work without this middleware. (source: zustand-subscribe-with-selector-2026.md) (source: zustand-readme-2026.md) (source: zustand-react-implementation-2026.md)

Transient subscriptions can update a ref or manipulate the view without scheduling React state. Updating a ref alone does not make displayed JSX reactive. The README presents this technique when direct view mutation is appropriate and recommends effect cleanup to unsubscribe. Hook selectors subscribe React components to selected values. (source: zustand-readme-2026.md) (source: zustand-react-implementation-2026.md)

## Related pages

[[react-render-verification]] describes how to verify these rendering boundaries.
