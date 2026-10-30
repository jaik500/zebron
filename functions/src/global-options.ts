import {setGlobalOptions} from "firebase-functions/v2";

/**
 * Defaults for every Cloud Function (v2).
 *
 * maxInstances caps how many copies of one function can run at once, so
 * a traffic spike, a retry storm or an attack cannot scale the bill
 * without limit. Each instance handles many requests at the same time
 * (concurrency defaults to 80), so 10 instances is roughly 800
 * simultaneous calls per function.
 *
 * A function can still set its own maxInstances to override this.
 * Raise the cap when real traffic needs it (watch the "instance count"
 * chart in the Cloud Run console).
 *
 * Imported second in index.ts, right after firebase-admin, because
 * global options only apply to functions defined after they are set.
 */
setGlobalOptions({
  maxInstances: 10,
});
