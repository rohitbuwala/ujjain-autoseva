import { runLocalNotificationProcess } from "../lib/local-notification-process";

runLocalNotificationProcess("worker", process.argv.slice(2)).catch(() => {
  console.error("Local worker stopped; check opt-in, activation cutoff, lock, topology and indexes.");
  process.exitCode = 1;
});
