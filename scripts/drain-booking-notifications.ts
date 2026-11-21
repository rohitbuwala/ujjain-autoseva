import { runLocalNotificationProcess } from "../lib/local-notification-process";

runLocalNotificationProcess("drain", process.argv.slice(2)).catch(() => {
  console.error("Local drain stopped; check opt-in, lock, topology and indexes before retrying.");
  process.exitCode = 1;
});
