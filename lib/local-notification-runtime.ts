import { createServer, type Server } from "node:net";
import mongoose from "mongoose";
import { assertLocalNotificationDrain } from "./local-notification-drain-guard";
import { guardNotificationWrite } from "./notification-delivery-control";

export const LOCAL_NOTIFICATION_URI = "mongodb://127.0.0.1:27018/ujjain_autoseva_local_test?replicaSet=uasLocalRs&directConnection=true";
export const LOCAL_NOTIFICATION_LOCK_PORT = 27119;

export function parseLocalNotificationArguments(mode: "worker" | "drain", args: string[]) {
  const flag = mode === "worker" ? "--confirm-local-notification-worker" : "--confirm-local-notification-drain";
  if (args[0] !== flag) throw new Error("explicit_local_notification_opt_in_required");
  if (mode === "drain" && args.length === 1) return undefined;
  // A fixed operator-approved cutoff is reused across restarts, rather than reset on each start.
  if (mode !== "worker" || args.length !== 3 || args[1] !== "--booking-created-since") {
    throw new Error("explicit_booking_activation_cutoff_required");
  }
  const since = new Date(args[2]);
  if (!Number.isFinite(+since) || since.toISOString() !== args[2]) throw new Error("invalid_activation_cutoff");
  return since;
}

// The lock is shared by the worker and manual drain and is released by the OS on process exit.
export async function acquireLocalNotificationLock(
  onLost: () => void,
  makeServer: () => Server = () => createServer(socket => socket.destroy()),
) {
  const server = makeServer();
  await new Promise<void>((resolve, reject) => {
    const failed = () => { reject(new Error("local_notification_lock_unavailable")); };
    server.once("error", failed);
    server.once("listening", () => {
      server.removeListener("error", failed);
      server.on("error", onLost);
      resolve();
    });
    server.listen({ host: "127.0.0.1", port: LOCAL_NOTIFICATION_LOCK_PORT, exclusive: true });
  });
  let released = false;
  return async () => {
    if (released) return;
    released = true;
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(new Error("local_notification_lock_close_failed")) : resolve()));
  };
}

// No work at import time. No dotenv/Next bootstrap, provider, or email imports.
export async function openLocalNotificationRuntime(
  mode: "worker" | "drain", args: string[], onLockLost: () => void,
  makeServer?: () => Server,
) {
  const createdSince = parseLocalNotificationArguments(mode, args);
  if (process.env.NODE_ENV === "production") throw new Error("local_notification_production_mode_refused");
  let lockLost = false;
  const unlock = await acquireLocalNotificationLock(() => { lockLost = true; onLockLost(); }, makeServer);
  try {
    process.env.MONGODB_URI = LOCAL_NOTIFICATION_URI;
    mongoose.set("autoCreate", false);
    mongoose.set("autoIndex", false);
    mongoose.set("bufferCommands", false);
    await mongoose.connect(LOCAL_NOTIFICATION_URI, {
      serverSelectionTimeoutMS: 3000, connectTimeoutMS: 3000, socketTimeoutMS: 10_000,
      maxPoolSize: 2, retryWrites: false,
    });
    const guard = async () => guardNotificationWrite(async () => {
      if (lockLost) throw new Error("lock_lost");
      const db = mongoose.connection.db;
      if (!db) throw new Error("connection_missing");
      const hello = await db.admin().command({ hello: 1 }, { timeoutMS: 3000 });
      const config = await db.admin().command({ replSetGetConfig: 1 }, { timeoutMS: 3000 });
      assertLocalNotificationDrain(db.databaseName, hello, config);
    });
    await guard();
    const db = mongoose.connection.db!;
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    if (!["bookings", "notifications", "users"].every(name => collections.some(c => c.name === name))) {
      throw new Error("required_local_collections_missing");
    }
    const indexes = await db.collection("notifications").indexes();
    if (!indexes.some(index => JSON.stringify(index.key) === '{"eventKey":1}' && index.unique &&
        !index.partialFilterExpression && !index.sparse && (!index.collation || index.collation.locale === "simple"))) {
      throw new Error("notification_unique_event_key_index_required");
    }
    return { guard, createdSince, close: async () => {
      try { await mongoose.disconnect(); } finally { await unlock(); }
    } };
  } catch (error) {
    try { await mongoose.disconnect(); } finally { await unlock(); }
    throw error;
  }
}
