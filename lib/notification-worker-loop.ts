import { setTimeout as delay } from "node:timers/promises";
import { NotificationGuardError } from "./notification-delivery-control";

export type DrainSummary = { delivered: number; skipped: number; retry: number; review: number; stale: number };
type WorkerOptions = {
  signal: AbortSignal;
  drain: () => Promise<DrainSummary>;
  report: (category: "batch" | "delivery_cycle_failed", summary?: DrainSummary) => void;
  wait?: (ms: number, signal: AbortSignal) => Promise<void>;
  random?: () => number;
};

// Separate process only. Await each batch and wait: cycles cannot overlap.
export async function runNotificationWorker(options: WorkerOptions) {
  const wait = options.wait ?? (async (ms, signal) => { await delay(ms, undefined, { signal }); });
  const random = options.random ?? Math.random;
  let idle = 0, failures = 0;
  while (!options.signal.aborted) {
    let pause: number;
    try {
      const summary = await options.drain();
      options.report("batch", summary);
      failures = 0;
      const processed = Object.values(summary).reduce((sum, count) => sum + count, 0);
      idle = processed ? 0 : idle + 1;
      pause = processed >= 20 ? 1000 : processed ? 5000 : Math.min(30_000, 5000 * 2 ** Math.min(idle - 1, 3));
    } catch (error) {
      if (error instanceof NotificationGuardError) throw error;
      options.report("delivery_cycle_failed");
      failures++;
      pause = Math.min(60_000, 5000 * 2 ** Math.min(failures - 1, 4));
      pause = Math.min(60_000, Math.round(pause * (1 + random() * 0.1)));
    }
    if (options.signal.aborted) break;
    try { await wait(pause, options.signal); }
    catch (error) { if (!options.signal.aborted) throw error; }
  }
}
