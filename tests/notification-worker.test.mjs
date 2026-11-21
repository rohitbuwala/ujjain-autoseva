import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createRequire } from "node:module";
import { afterEach, beforeEach, test } from "node:test";
import mongoose from "mongoose";

const load = createRequire(import.meta.url);
const { runNotificationWorker } = load("../lib/notification-worker-loop.ts");
const { NotificationGuardError } = load("../lib/notification-delivery-control.ts");
const { parseLocalNotificationArguments, acquireLocalNotificationLock, openLocalNotificationRuntime,
  LOCAL_NOTIFICATION_URI, LOCAL_NOTIFICATION_LOCK_PORT } = load("../lib/local-notification-runtime.ts");
const { installNotificationShutdown } = load("../lib/local-notification-process.ts");
global.fetch = () => assert.fail("No external requests permitted");
const empty = () => ({ delivered: 0, skipped: 0, retry: 0, review: 0, stale: 0 });
const since = "2026-11-20T00:00:00.000Z";
const workerArgs = ["--confirm-local-notification-worker", "--booking-created-since", since];
let held, connectCalls, closeCalls, commands, hello, config, indexes;
let originalDb, originalUri, originalNodeEnv;

// Fake listener only: no socket or database connection is opened.
class FakeServer extends EventEmitter {
  listen(options) {
    assert.deepEqual(options, { host: "127.0.0.1", port: LOCAL_NOTIFICATION_LOCK_PORT, exclusive: true });
    if (held) queueMicrotask(() => this.emit("error", Error("fixture occupied")));
    else { held = { server: this }; queueMicrotask(() => this.emit("listening")); }
  }
  close(callback) { if (held?.server === this) held = null; callback(); }
}
const makeServer = () => new FakeServer();
beforeEach(() => {
  held = null; connectCalls = []; closeCalls = 0; commands = [];
  originalDb = mongoose.connection.db;
  originalUri = process.env.MONGODB_URI;
  originalNodeEnv = process.env.NODE_ENV;
  delete process.env.NODE_ENV;
  hello = { ok: 1, isWritablePrimary: true, setName: "uasLocalRs", me: "127.0.0.1:27018", primary: "127.0.0.1:27018", hosts: ["127.0.0.1:27018"] };
  config = { ok: 1, config: { _id: "uasLocalRs", members: [{ host: "127.0.0.1:27018" }] } };
  indexes = [{ key: { eventKey: 1 }, unique: true }];
  mongoose.connect = async (...args) => { connectCalls.push(args); };
  mongoose.disconnect = async () => { closeCalls++; };
  mongoose.connection.db = {
    databaseName: "ujjain_autoseva_local_test",
    admin: () => ({ command: async command => {
      commands.push(command);
      if (command.hello) return structuredClone(hello);
      if (command.replSetGetConfig) return structuredClone(config);
      assert.fail("Unexpected database command");
    } }),
    listCollections: () => ({ toArray: async () => ["users", "notifications", "bookings"].map(name => ({ name })) }),
    collection: name => {
      assert.equal(name, "notifications");
      return { indexes: async () => structuredClone(indexes) };
    },
  };
});
afterEach(() => {
  mongoose.connection.db = originalDb;
  if (originalUri === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = originalUri;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv;
});

test("worker/drain opt-ins and fixed canonical activation cutoff are required before connection", async () => {
  for (const args of [[], ["--confirm-local-notification-drain"], [workerArgs[0]], [workerArgs[0], "--booking-created-since", "bad"]]) {
    await assert.rejects(openLocalNotificationRuntime("worker", args, () => {}, makeServer));
  }
  assert.equal(connectCalls.length, 0); assert.equal(held, null);
  assert.deepEqual(parseLocalNotificationArguments("worker", workerArgs), new Date(since));
  assert.equal(parseLocalNotificationArguments("drain", ["--confirm-local-notification-drain"]), undefined);
});

test("production mode is refused before locking or connecting", async () => {
  process.env.NODE_ENV = "production";
  await assert.rejects(openLocalNotificationRuntime("worker", workerArgs, () => {}, makeServer));
  assert.equal(connectCalls.length, 0); assert.equal(held, null);
});

test("runtime overrides inherited URI and checks fresh topology on every guard invocation", async () => {
  process.env.MONGODB_URI = "remote-fixture-must-never-be-used";
  const runtime = await openLocalNotificationRuntime("worker", workerArgs, () => {}, makeServer);
  assert.equal(connectCalls[0][0], LOCAL_NOTIFICATION_URI);
  assert.equal(process.env.MONGODB_URI, LOCAL_NOTIFICATION_URI);
  assert.equal(connectCalls[0][1].retryWrites, false);
  assert.equal(mongoose.get("autoCreate"), false);
  assert.equal(mongoose.get("autoIndex"), false);
  assert.equal(mongoose.get("bufferCommands"), false);
  assert.equal(commands.length, 2);
  await runtime.guard(); assert.equal(commands.length, 4);
  hello.me = "remote-fixture:27017";
  await assert.rejects(runtime.guard(), NotificationGuardError);
  await runtime.close(); assert.equal(held, null);
});

test("unsafe startup topology and missing unique index release the lock and disconnect", async () => {
  hello.isWritablePrimary = false;
  await assert.rejects(openLocalNotificationRuntime("worker", workerArgs, () => {}, makeServer), NotificationGuardError);
  assert.equal(held, null); assert.equal(closeCalls, 1);
  hello.isWritablePrimary = true; indexes = [];
  await assert.rejects(openLocalNotificationRuntime("worker", workerArgs, () => {}, makeServer));
  assert.equal(held, null); assert.equal(closeCalls, 2);
});

test("manual drain and worker share one exclusive lock and a second process cannot connect", async () => {
  const runtime = await openLocalNotificationRuntime("worker", workerArgs, () => {}, makeServer);
  await assert.rejects(openLocalNotificationRuntime("drain", ["--confirm-local-notification-drain"], () => {}, makeServer));
  assert.equal(connectCalls.length, 1);
  await runtime.close();
  const release = await acquireLocalNotificationLock(() => {}, makeServer);
  await release(); await release(); assert.equal(held, null);
});

test("loss of lock requests shutdown and makes later write guards fail closed", async () => {
  let lost = 0;
  const runtime = await openLocalNotificationRuntime("worker", workerArgs, () => { lost++; }, makeServer);
  held.server.emit("error", Error("fixture listener lost"));
  assert.equal(lost, 1);
  await assert.rejects(runtime.guard(), NotificationGuardError);
  await runtime.close();
});

test("sequential cycles apply idle backoff without overlap and stop after abort", async () => {
  const controller = new AbortController(); const pauses = [];
  let active = 0, maxActive = 0;
  await runNotificationWorker({ signal: controller.signal,
    drain: async () => { active++; maxActive = Math.max(active, maxActive); await Promise.resolve(); active--; return empty(); },
    report: () => {}, wait: async ms => { pauses.push(ms); if (pauses.length === 5) controller.abort(); },
  });
  assert.deepEqual(pauses, [5000, 10_000, 20_000, 30_000, 30_000]); assert.equal(maxActive, 1);
});

test("full and partial batches use bounded polling delays and reset idle backoff", async () => {
  const controller = new AbortController(); const pauses = []; let calls = 0;
  await runNotificationWorker({ signal: controller.signal,
    drain: async () => ({ ...empty(), delivered: [0, 0, 20, 1, 0][calls++] }), report: () => {},
    wait: async ms => { pauses.push(ms); if (pauses.length === 5) controller.abort(); },
  });
  assert.deepEqual(pauses, [5000, 10_000, 1000, 5000, 5000]);
});

test("database cycle errors are reported safely with capped backoff", async () => {
  const controller = new AbortController(); const pauses = [], reports = [];
  await runNotificationWorker({ signal: controller.signal, random: () => 0,
    drain: async () => { throw Error("fixture private detail"); }, report: (...args) => reports.push(args),
    wait: async ms => { pauses.push(ms); if (pauses.length === 6) controller.abort(); },
  });
  assert.deepEqual(pauses, [5000, 10_000, 20_000, 40_000, 60_000, 60_000]);
  assert.ok(reports.every(args => args.length === 1 && args[0] === "delivery_cycle_failed"));
});

test("topology guard failures exit the worker without automatic retry", async () => {
  const controller = new AbortController(); let calls = 0;
  await assert.rejects(runNotificationWorker({ signal: controller.signal,
    drain: async () => { calls++; throw new NotificationGuardError(); }, report: () => assert.fail("must propagate"),
    wait: async () => assert.fail("must not retry unsafe topology"),
  }), NotificationGuardError);
  assert.equal(calls, 1);
});

test("shutdown during an active batch permits completion but starts no further batch", async () => {
  const controller = new AbortController(); let finish, started;
  const ready = new Promise(resolve => { started = resolve; });
  const running = runNotificationWorker({ signal: controller.signal,
    drain: () => new Promise(resolve => { finish = resolve; started(); }), report: () => {},
    wait: async () => assert.fail("no wait after shutdown"),
  });
  await ready; controller.abort(); finish(empty()); await running;
});

test("SIGINT/SIGTERM stop once, enforce a 20 second deadline and remove handlers", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const signals = new EventEmitter(); let forced = 0;
  const shutdown = installNotificationShutdown(() => { forced++; }, signals);
  signals.emit("SIGINT"); assert.equal(shutdown.signal.aborted, true);
  t.mock.timers.tick(19_999); assert.equal(forced, 0);
  t.mock.timers.tick(1); assert.equal(forced, 1);
  shutdown.dispose(); assert.equal(signals.listenerCount("SIGTERM"), 0);
});
