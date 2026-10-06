# Price cell flashes during repeated updates

## Price changes and presentation changes

Numeric equality can differ from source-string equality. The synthetic JavaScript run converted `"0.50"` and `"0.500"` to the same number. `toFixed` controls decimal places, so a formatting change can change a cell's text without changing its numeric value. An indicator based on numeric direction and one based on displayed text consequently represent different events. The sources do not decide which event a project should highlight. (source: poking_around_api/2026-10-06-price-display/numbers-result.json) (source: ecmascript-numbers-dates-2026.md)

A known-to-known numeric comparison can establish increase, decrease, or equality. An unavailable value supplies no numeric reference for that comparison. Assigning a direction to initialization, disappearance, or recovery requires an additional UI policy. This follows from the unavailable snapshot trade seeds and the distinction between missing inputs and numeric zero, rather than an exchange-defined flash rule. (source: poking_around_api/2026-10-06-price-display/analysis-result.json) (source: poking_around_api/2026-10-06-price-display/numbers-result.json)

## Timer replacement and stale cleanup

The HTML Standard defines `setTimeout` as scheduling a callback after a requested delay and `clearTimeout` as cancelling the identified timer. Timers retain separate IDs. An uncancelled older timer can therefore still run after a newer change schedules its own timer. The standard checks that the timer ID still exists and has the same internal handle before invoking its callback. (source: whatwg-html-timers-2026.md)

For an illustrative 500 ms flash, a change at time 0 schedules cleanup at time 500. Another change at time 300 schedules cleanup at time 800. If both callbacks clear the same highlight, the first can clear the newer highlight after only 200 ms. Cancelling the old timer when replacing it prevents that old callback from running. Guarding cleanup with a current change identifier is another application-level way to prevent obsolete cleanup from clearing current state. This is reasoning from the timer model, not a measured browser experiment or a selected project policy. (source: whatwg-html-timers-2026.md)

The timer API explicitly does not guarantee exact execution time. CPU load, other tasks, document activity, worker suspension, and optional browser padding can delay execution. A requested 500 ms delay describes scheduling intent, rather than a guarantee of precisely 500 ms of visible highlighting. (source: whatwg-html-timers-2026.md)

## CSS animation continuity and restart

The CSS Animations Level 1 editor's draft says an animation begins when its animation style and corresponding keyframes are resolved. An existing animation continues until it ends or its name is removed. Updating matching animation names preserves their playback time, and modifying keyframe rules does not itself restart an animation. Reapplying an unchanged animation name therefore does not establish a new playback cycle for a repeated increase or decrease. (source: w3c-css-animations-full-2026.md)

An unmatched animation name creates a new animation. Removing an animation or making the element `display: none` can cancel it. Pausing and resuming preserves progress rather than resetting it. These are animation-model distinctions, not browser verification of a particular class-toggle or React implementation. The timing of style resolution also matters to whether intermediate changes become distinct animation states. (source: w3c-css-animations-full-2026.md)

Timer replacement and animation restart address separate mechanics. Replacing a cleanup timer alone does not reset CSS playback. Restarting an animation alone does not cancel an older JavaScript timer. A scheme that uses both mechanisms must account for both lifecycles to make a repeated-change policy coherent. This is an inference from the two specifications. (source: whatwg-html-timers-2026.md) (source: w3c-css-animations-full-2026.md)

## Completion events and policy limits

The CSS draft distinguishes `animationend`, emitted when an animation finishes, from `animationcancel`, emitted when an animation is stopped without finishing. Cleanup that relies on completion alone consequently does not cover cancellation. The draft defines `animationName` on these events, which identifies the animation that produced the event. It does not define an application price-change identifier. (source: w3c-css-animations-full-2026.md)

Restarting from the newest change, keeping the original deadline, and changing color during an existing cycle are different UI policies. The browser specifications explain their mechanics without selecting a policy for price cells. No browser timing, rapid-update animation, unmount, or React batching experiment was performed in this research. The preserved experiments concern numeric behavior and offline exchange-frame analysis only. (source: whatwg-html-timers-2026.md) (source: w3c-css-animations-full-2026.md) (source: poking_around_api/2026-10-06-price-display/numbers-README.md) (source: poking_around_api/2026-10-06-price-display/README.md)

## Related pages

[[polymarket-price-correctness]] covers precision, spreads, missing values, and source discrepancies. [[zustand-streaming-state]] covers selector equality and subscription boundaries. [[react-render-verification]] covers render measurement separately from animation behavior.
