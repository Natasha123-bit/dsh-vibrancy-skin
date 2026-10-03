/**
 * dsh-vibrancy-skin — Node-side half.
 *
 * All of the work happens in the client half (./client.js), which injects a
 * single material-only stylesheet. This Node half exists because the cordis
 * loader needs a resolvable plugin entry point for the bundle insert; it
 * deliberately does nothing so the Node layer stack is unaffected.
 */
export function apply(ctx) {
  // no-op: see comment above.
}
