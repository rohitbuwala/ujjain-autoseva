import { openLocalNotificationRuntime } from "./local-notification-runtime";
import { runNotificationWorker } from "./notification-worker-loop";

export function installNotificationShutdown(
  forceExit: () => void,
  signals: Pick<NodeJS.Process, "on" | "removeListener"> = process,
) {
  const controller = new AbortController();
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    if (controller.signal.aborted) { forceExit(); return; }
    controller.abort();
    deadline = setTimeout(forceExit, 20_000);
    deadline.unref();
  };
  signals.on("SIGINT", stop);
  signals.on("SIGTERM", stop);
  return { signal: controller.signal, stop, dispose: () => {
    if (deadline) clearTimeout(deadline);
    signals.removeListener("SIGINT", stop);
    signals.removeListener("SIGTERM", stop);
  } };
}

// Called only by explicit CLI entry points. Importing this module starts nothing.
export async function runLocalNotificationProcess(mode: "worker" | "drain", args: string[]) {
  const shutdown = installNotificationShutdown(() => {
    console.error("Notification shutdown deadline reached; leases remain for recovery.");
    process.exit(1);
  });
  let runtime: Awaited<ReturnType<typeof openLocalNotificationRuntime>> | undefined;
  try {
    runtime = await openLocalNotificationRuntime(mode, args, () => {
      process.exitCode = 1;
      shutdown.stop();
    });
    const { drainBookingOutbox } = await import("./booking-notification-events");
    const drain = () => drainBookingOutbox(20, {
      beforeWrite: runtime!.guard, signal: shutdown.signal, createdSince: runtime!.createdSince,
      onDeliveryError: () => console.warn("Notification delivery failed; retry policy retained."),
    });
    if (mode === "worker") {
      console.log("Local notification worker enabled; protected and pre-cutoff bookings excluded.");
      await runNotificationWorker({ signal: shutdown.signal, drain,
        report: (category, summary) => {
          if (category === "batch") {
            if (summary && Object.values(summary).some(Boolean)) console.log(category, summary);
          } else console.error(category);
        } });
    } else if (!shutdown.signal.aborted) console.log(await drain());
  } finally {
    try { await runtime?.close(); } finally { shutdown.dispose(); }
  }
}
