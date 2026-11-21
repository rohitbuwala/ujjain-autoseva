import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { beforeEach, test } from "node:test";
import mongoose from "mongoose";

const load = createRequire(import.meta.url);
const clone = value => structuredClone(value);
const customer = "65e000000000000000000001";
const admin = "65e000000000000000000002";
const other = "65e000000000000000000003";
const id = "65e000000000000000000004";
let rows, users, notices, identity, failWrite, failNotice, failAck, mailCalls, beforeNotice;
let noticeCalls, writes, ackFilters, mutationSequence;
mongoose.connect = () => assert.fail("No database connections permitted");
global.fetch = () => assert.fail("No external requests permitted");
function stub(path, exports) {
  const filename = load.resolve(path);
  load.cache[filename] = { id: filename, filename, loaded: true, exports };
}
function equal(a, b) {
  if (a instanceof Date && b instanceof Date) return +a === +b;
  return b === null ? a == null : String(a) === String(b);
}
function matches(row, filter) {
  return !!row && Object.entries(filter).every(([key, wanted]) => {
    if (key === "$or") return wanted.some(part => matches(row, part));
    if (key === "$expr") return evaluate(wanted, row);
    const value = row[key];
    if (!wanted || typeof wanted !== "object" || wanted instanceof Date) return equal(value, wanted);
    return Object.entries(wanted).every(([op, argument]) => {
      if (op === "$in") return argument.some(item => equal(value, item));
      if (op === "$ne") return !equal(value, argument);
      if (op === "$exists") return (value !== undefined) === argument;
      if (op === "$lt") return value < argument;
      if (op === "$lte") return value <= argument;
      if (op === "$gt") return value > argument;
      if (op === "$gte") return value >= argument;
      if (op === "$elemMatch") return value?.some(item => matches(item, argument));
      assert.fail("Unhandled filter: " + op);
    });
  });
}
const REMOVE = Symbol("remove");
function evaluate(value, row, variables = {}) {
  const read = expr => evaluate(expr, row, variables);
  if (value === "$$REMOVE") return REMOVE;
  if (value === "$$NOW") return new Date();
  if (typeof value === "string" && value.startsWith("$$")) {
    const [name, field] = value.slice(2).split(".");
    return field ? variables[name]?.[field] : variables[name];
  }
  if (typeof value === "string" && value.startsWith("$")) return row[value.slice(1)];
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(read);
  if ("$literal" in value) return clone(value.$literal);
  if ("$ifNull" in value) return read(value.$ifNull[0]) ?? read(value.$ifNull[1]);
  if ("$concatArrays" in value) return read(value.$concatArrays).flat();
  if ("$cond" in value) return read(value.$cond[read(value.$cond[0]) ? 1 : 2]);
  if ("$eq" in value) return equal(...read(value.$eq));
  if ("$ne" in value) return !equal(...read(value.$ne));
  if ("$gt" in value) { const [a, b] = read(value.$gt); return a > b; }
  if ("$type" in value) return read(value.$type) instanceof Date ? "date" : typeof read(value.$type);
  if ("$map" in value) return read(value.$map.input).map(item =>
    evaluate(value.$map.in, row, { ...variables, [value.$map.as]: item }));
  if ("$anyElementTrue" in value) return read(value.$anyElementTrue)[0].some(Boolean);
  if ("$in" in value) { const [a, b] = read(value.$in); return b.includes(a); }
  if ("$and" in value) return value.$and.every(read);
  if ("$or" in value) return value.$or.some(read);
  assert.fail("Unhandled expression");
}
function apply(row, update, filter) {
  if (Array.isArray(update)) {
    for (const stage of update) {
      const before = clone(row);
      for (const [key, expr] of Object.entries(stage.$set)) {
        const value = evaluate(expr, before);
        if (value === REMOVE) delete row[key]; else row[key] = value;
      }
    }
    return;
  }
  const entry = filter.notificationOutbox
    ? row.notificationOutbox.find(item => matches(item, filter.notificationOutbox.$elemMatch)) : null;
  for (const [op, fields] of Object.entries(update)) {
    for (const [key, value] of Object.entries(fields)) {
      const target = key.startsWith("notificationOutbox.$.") ? entry : row;
      const field = key.startsWith("notificationOutbox.$.") ? key.split(".").at(-1) : key;
      if (op === "$set") target[field] = clone(value);
      else if (op === "$inc") target[field] = (target[field] ?? 0) + value;
      else if (op === "$unset") delete target[field];
      else if (op === "$push") target[field] = [...(target[field] ?? []), ...clone(value.$each)];
      else assert.fail("Unhandled update");
    }
  }
}
function query(value) {
  return { select() { return this; }, lean: async () => clone(value),
    then(resolve, reject) { return Promise.resolve(clone(value)).then(resolve, reject); } };
}
const schemaModule = load("../models/Booking.ts");
const schemaModel = schemaModule.default ?? schemaModule;
stub("../models/Booking.ts", {
  async create(input) {
    if (failWrite) throw Error("fixture persistence failure");
    const row = clone({ ...input, _id: String(input._id) });
    rows.push(row); writes.push(clone(input));
    return { ...clone(row), toObject: () => clone(row) };
  },
  findOne: filter => query(rows.find(row => matches(row, filter)) ?? null),
  findById: key => query(rows.find(row => equal(row._id, key)) ?? null),
  findOneAndUpdate(filter, update) {
    mutationSequence.push(update.$inc ? "claim" : "recovery");
    if (failWrite) throw Error("fixture persistence failure");
    const row = rows.find(item => matches(item, filter));
    if (row) { apply(row, update, filter); writes.push(clone(update)); }
    return query(row ?? null);
  },
  async updateOne(filter, update) {
    mutationSequence.push("ack");
    if (failAck) { failAck = false; throw Error("fixture ack failure"); }
    // Casting a query is offline: confirm the installed Mongoose preserves the server-time fence.
    const query = schemaModel.updateOne(filter, update);
    query.cast(schemaModel);
    assert.deepEqual(query.getFilter().$expr, filter.$expr);
    ackFilters.push(clone(filter));
    const row = rows.find(item => matches(item, filter));
    if (row) apply(row, update, filter);
    return { matchedCount: row ? 1 : 0 };
  },
  async updateMany(filter, update, options) {
    assert.equal(update.$set["notificationOutbox.$[entry].state"], "review");
    const entryFilter = Object.fromEntries(Object.entries(options.arrayFilters[0]).map(([k, v]) => [k.slice(6), v]));
    for (const row of rows.filter(item => matches(item, filter))) {
      for (const entry of row.notificationOutbox.filter(item => matches(item, entryFilter))) entry.state = "review";
    }
  },
});
stub("../models/User.ts", {
  find: filter => query(users.filter(user => matches(user, filter))),
  exists: async filter => users.some(user => matches(user, filter)),
});
class Notification {
  constructor(input) { Object.assign(this, clone(input)); }
  static async init() { mutationSequence.push("init"); }
  static async findOne(filter) { return clone(notices.find(item => matches(item, filter)) ?? null); }
  async save() {
    mutationSequence.push("insert");
    noticeCalls++;
    if (beforeNotice) await beforeNotice(this);
    if (failNotice) throw Error("fixture notification failure");
    if (notices.some(item => item.eventKey === this.eventKey)) {
      throw new mongoose.mongo.MongoServerError({ code: 11000, keyPattern: { eventKey: 1 } });
    }
    notices.push(clone({ ...this }));
    return this;
  }
}
stub("../models/Notification.ts", Notification);
stub("../lib/db.ts", async () => {});
stub("../app/api/auth/[...nextauth]/route.ts", { authOptions: {} });
stub("next-auth", { getServerSession: async () => identity ? { user: identity } : null });
stub("../lib/rate-limit.ts", { rateLimit: () => ({ success: true }), getRateLimitIdentifier: () => "fixture" });
const failedEmail = async () => { mailCalls++; throw Error("fixture disabled email"); };
stub("../lib/mail.ts", { sendBookingCreatedEmails: failedEmail, sendCancellationEmail: failedEmail,
  sendConfirmationEmail: failedEmail, sendRejectionEmail: failedEmail });
stub("../models/Service.ts", { findOne: async () => ({ from: "Test pickup", to: "Test drop", price: 10 }) });
stub("../models/Temple.ts", { find: async () => [] });
stub("../models/Route.ts", { findOne: () => query({ _id: id, totalPrice: 10 }) });

const { bookingEvent, appendBookingEvent, drainBookingOutbox, publicBooking } = load("../lib/booking-notification-events.ts");
const { inactiveBookingUpdate } = load("../lib/booking-payments.ts");
const { assertLocalNotificationDrain } = load("../lib/local-notification-drain-guard.ts");
const { NotificationGuardError } = load("../lib/notification-delivery-control.ts");
const standard = load("../app/api/booking/route.ts");
const custom = load("../app/api/custom-booking/route.ts");
const adminRoute = load("../app/api/admin/bookings/[id]/route.ts");
const cancel = load("../app/api/booking/[id]/cancel/route.ts");
const params = { params: Promise.resolve({ id }) };
const request = (body, method = "POST") => new Request("http://fixture.test/booking", {
  method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
const binding = { _id: id, bookingId: "UA-FIXTURE", userId: customer };
function pending() {
  return { ...binding, name: "Test Customer", email: "customer@example.invalid", price: "10", status: "pending",
    paymentAmount: 10, paymentCurrency: "INR", paymentMethod: "none", paymentStatus: "not_required" };
}
async function queued() {
  const events = await bookingEvent(binding, "confirmed");
  rows = [{ ...pending(), notificationOutbox: events }];
  return rows[0].notificationOutbox[0];
}
beforeEach(() => {
  rows = []; notices = []; writes = []; users = [{ _id: customer, role: "user" }, { _id: admin, role: "admin" }, { _id: other, role: "user" }];
  identity = { id: customer, role: "user", email: "customer@example.invalid" };
  failWrite = failNotice = failAck = false; mailCalls = noticeCalls = 0; beforeNotice = null; ackFilters = []; mutationSequence = [];
});

test("optional hidden schema field does not backfill legacy bookings", () => {
  const booking = new schemaModel(pending());
  assert.equal(booking.notificationOutbox, undefined);
  assert.equal(schemaModel.schema.path("notificationOutbox").options.select, false);
});
test("local drain guard rejects remote, secondary, extra, passive and arbiter members", () => {
  const database = "ujjain_autoseva_local_test";
  const hello = { ok: 1, isWritablePrimary: true, setName: "uasLocalRs", me: "127.0.0.1:27018", primary: "127.0.0.1:27018", hosts: ["127.0.0.1:27018"] };
  const config = { ok: 1, config: { _id: "uasLocalRs", members: [{ host: "127.0.0.1:27018" }] } };
  assert.doesNotThrow(() => assertLocalNotificationDrain(database, hello, config));
  assert.throws(() => assertLocalNotificationDrain("production", hello, config));
  for (const change of [{ me: "remote:27017" }, { primary: "remote:27017" }, { setName: "other" },
    { isWritablePrimary: false }, { hosts: ["remote:27017"] }, { passives: ["remote:27017"] }, { arbiters: ["remote:27017"] }]) {
    assert.throws(() => assertLocalNotificationDrain(database, { ...hello, ...change }, config));
  }
  for (const members of [[], [{ host: "remote:27017" }], [...config.config.members, { host: "remote:27017" }]]) {
    assert.throws(() => assertLocalNotificationDrain(database, hello, { ok: 1, config: { _id: "uasLocalRs", members } }));
  }
});
test("draining a historical booking with no outbox does not generate events", async () => {
  rows = [pending()];
  assert.deepEqual(await drainBookingOutbox(2), { delivered: 0, skipped: 0, retry: 0, review: 0, stale: 0 });
  assert.equal(rows[0].notificationOutbox, undefined); assert.equal(notices.length, 0);
});
test("standard and custom creation persist event recipients in the same insert and redact responses despite email failure", async () => {
  const body = { name: "Test Customer", phone: "9000000000", pickup: "Test pickup", drop: "Test drop", date: "2099-01-01", time: "10:00", price: "10", serviceId: id,
    recipientId: other, notificationOutbox: [{ recipientId: other }], packageType: "test", packageName: "Test", totalPrice: 10 };
  for (const route of [standard, custom]) {
    const response = await route.POST(request(body));
    assert.ok(response.ok);
    assert.equal((await response.json()).data.notificationOutbox, undefined);
    const saved = rows.at(-1);
    assert.equal(saved.status, "pending");
    assert.deepEqual(saved.notificationOutbox.map(item => item.recipientId).sort(), [customer, admin].sort());
    assert.ok(saved.notificationOutbox.every(item => item.eventKey.includes(saved._id)));
  }
  assert.equal(writes.length, 2); assert.equal(mailCalls, 2); assert.equal(noticeCalls, 0);
});
test("failed booking insert persists neither booking nor event", async () => {
  failWrite = true;
  const response = await standard.POST(request({ name: "Test Customer", phone: "9000000000", pickup: "Test pickup", drop: "Test drop", date: "2099", time: "10:00", price: "10" }));
  assert.equal(response.status, 500); assert.equal(rows.length, 0); assert.equal(notices.length, 0);
});
test("admin confirmation, rejection and cancellation emit only on the winning transition", async () => {
  identity = { id: admin, role: "admin" };
  for (const status of ["confirmed", "rejected", "cancelled"]) {
    rows = [pending()]; writes = [];
    const responses = await Promise.all([1, 2].map(() => adminRoute.PATCH(request({ status, recipientId: other }, "PATCH"), params)));
    assert.ok(responses.every(response => response.ok));
    assert.equal(rows[0].notificationOutbox.length, 1);
    assert.equal(rows[0].notificationOutbox[0].recipientId, customer);
    assert.equal(rows[0].status, status);
    assert.equal(writes.length, 1);
    assert.equal((await responses[0].json()).notificationOutbox, undefined);
  }
});
test("detail edits, unauthorized calls and failed writes create no events", async () => {
  rows = [pending()];
  assert.equal((await adminRoute.PATCH(request({ status: "confirmed" }, "PATCH"), params)).status, 401);
  identity = { id: admin, role: "admin" };
  assert.ok((await adminRoute.PATCH(request({ driverName: "Test Driver" }, "PATCH"), params)).ok);
  assert.equal(rows[0].notificationOutbox, undefined);
  failWrite = true;
  assert.equal((await adminRoute.PATCH(request({ status: "confirmed" }, "PATCH"), params)).status, 500);
  assert.equal(rows[0].status, "pending"); assert.equal(rows[0].notificationOutbox, undefined);
});
test("customer cancellation targets current admins, protects ownership and does not duplicate", async () => {
  rows = [pending()]; identity = { id: other, role: "user" };
  assert.equal((await cancel.POST(request({}), params)).status, 403);
  assert.equal(rows[0].notificationOutbox, undefined);
  identity = { id: customer, role: "user" };
  assert.ok((await cancel.POST(request({ reason: "test" }), params)).ok);
  assert.equal((await cancel.POST(request({}), params)).status, 400);
  assert.deepEqual(rows[0].notificationOutbox.map(item => item.recipientId), [admin]);
});
test("outbox pipeline preserves all existing paid cancellation and reconciliation expressions", async () => {
  const original = { ...pending(), status: "confirmed", paymentStatus: "paid", paymentMethod: "online", razorpayOrderId: "order_test", razorpayPaymentId: "pay_test", paidAt: new Date(), reservedPaise: 123, reconciliationLeaseToken: "existing" };
  const pipeline = inactiveBookingUpdate({ status: "cancelled" });
  const composed = appendBookingEvent(pipeline, await bookingEvent(binding, "admin_cancelled"));
  assert.deepEqual(composed[0], pipeline[0]);
  const expected = clone(original), actual = clone(original);
  apply(expected, pipeline, {}); apply(actual, composed, {});
  assert.deepEqual(publicBooking(actual), expected);
});
test("concurrent drains claim once and acknowledge without modifying booking/payment state", async () => {
  await queued(); const before = publicBooking(rows[0]);
  await Promise.all([drainBookingOutbox(1), drainBookingOutbox(1)]);
  assert.equal(notices.length, 1); assert.equal(noticeCalls, 1);
  assert.equal(rows[0].notificationOutbox[0].state, "delivered");
  assert.deepEqual(publicBooking(rows[0]), before);
});
test("failed delivery backs off, retries, and exhausts into review", async () => {
  const entry = await queued(); failNotice = true;
  assert.equal((await drainBookingOutbox(1)).retry, 1);
  assert.ok(entry.nextAt > new Date());
  assert.equal((await drainBookingOutbox(1)).retry, 0);
  for (let attempt = 2; attempt <= 5; attempt++) {
    entry.nextAt = new Date(0); await drainBookingOutbox(1);
    assert.equal(entry.attempts, attempt);
  }
  assert.equal(entry.state, "review"); assert.equal(notices.length, 0);
});
test("lost acknowledgment recovers after lease expiry without resetting an existing notification read timestamp", async () => {
  const entry = await queued(); failAck = true;
  await assert.rejects(drainBookingOutbox(1));
  assert.equal(notices.length, 1); assert.equal(entry.state, "pending");
  const readAt = new Date(); notices[0].readAt = readAt;
  entry.leaseUntil = new Date(0);
  assert.equal((await drainBookingOutbox(1)).delivered, 1);
  assert.equal(notices.length, 1); assert.deepEqual(notices[0].readAt, readAt);
});
test("delivery revalidates admin role and stored customer ownership", async () => {
  rows = [{ ...pending(), notificationOutbox: await bookingEvent(binding, "created") }];
  users.find(user => user._id === admin).role = "user";
  rows[0].userId = other;
  assert.equal((await drainBookingOutbox(5)).skipped, 2);
  assert.equal(notices.length, 0);
});
test("stale workers cannot acknowledge a replacement lease; expired final attempts remain under review", async () => {
  const entry = await queued();
  beforeNotice = async () => { entry.leaseToken = "replacement"; };
  assert.equal((await drainBookingOutbox(1)).stale, 1);
  assert.equal(entry.state, "pending");
  entry.attempts = 5; entry.leaseUntil = new Date(0);
  await drainBookingOutbox(1);
  assert.equal(entry.state, "review");
});

test("acknowledgment before expiry uses server time and clears its live lease", async t => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const entry = await queued();
  beforeNotice = async () => { t.mock.timers.tick(44_999); };
  assert.equal((await drainBookingOutbox(1)).delivered, 1);
  assert.equal(entry.state, "delivered");
  assert.equal(entry.leaseToken, undefined);
  assert.equal(entry.leaseUntil, undefined);
  assert.equal(entry.attempts, 1);
  const filter = ackFilters[0];
  assert.equal(filter.notificationOutbox.$elemMatch.leaseToken.length > 0, true);
  assert.equal(filter.notificationOutbox.$elemMatch.leaseUntil, undefined);
  assert.ok(JSON.stringify(filter.$expr).includes('"$$NOW"'));
});

test("expired acknowledgment without replacement leaves the claimed event completely unchanged", async t => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const entry = await queued();
  let claimed;
  beforeNotice = async () => {
    claimed = clone(entry);
    t.mock.timers.tick(45_001);
  };
  assert.equal((await drainBookingOutbox(1)).stale, 1);
  assert.deepEqual(entry, claimed);
  assert.equal(notices.length, 1);
});

test("acknowledgment exactly at lease expiry is rejected", async t => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const entry = await queued();
  beforeNotice = async () => { t.mock.timers.tick(45_000); };
  assert.equal((await drainBookingOutbox(1)).stale, 1);
  assert.equal(entry.state, "pending");
  assert.equal(entry.attempts, 1);
});

test("a replacement worker's successful acknowledgment cannot be overwritten by the expired worker", async t => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const entry = await queued();
  let replacement;
  beforeNotice = async () => {
    t.mock.timers.tick(45_001);
    beforeNotice = null;
    assert.equal((await drainBookingOutbox(1)).delivered, 1);
    notices[0].readAt = new Date();
    replacement = clone(entry);
  };
  assert.equal((await drainBookingOutbox(1)).stale, 1);
  assert.deepEqual(entry, replacement);
  assert.equal(entry.attempts, 2);
  assert.equal(notices.length, 1);
  assert.ok(notices[0].readAt instanceof Date);
});

test("retry after an expired acknowledgment reuses the existing notification and preserves read status", async t => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const entry = await queued();
  beforeNotice = async () => { t.mock.timers.tick(45_001); };
  assert.equal((await drainBookingOutbox(1)).stale, 1);
  const readAt = new Date();
  notices[0].readAt = readAt;
  beforeNotice = null;
  assert.equal((await drainBookingOutbox(1)).delivered, 1);
  assert.equal(entry.attempts, 2);
  assert.equal(entry.state, "delivered");
  assert.equal(notices.length, 1);
  assert.deepEqual(notices[0].readAt, readAt);
});

test("every claim, recovery, notification initialization/insertion and acknowledgment is guarded", async () => {
  await queued();
  const guard = async () => { mutationSequence.push("guard"); };
  await drainBookingOutbox(1, { beforeWrite: guard });
  assert.deepEqual(mutationSequence, ["guard", "recovery", "guard", "claim", "guard", "init", "guard", "insert", "guard", "ack"]);
});

test("a failed guard at any write boundary stops without acknowledgment or retry scheduling", async () => {
  for (let boundary = 1; boundary <= 5; boundary++) {
    notices = []; ackFilters = []; mutationSequence = [];
    const entry = await queued(); let guards = 0;
    await assert.rejects(drainBookingOutbox(1, { beforeWrite: async () => {
      if (++guards === boundary) throw Error("fixture unsafe topology");
    } }), NotificationGuardError);
    assert.equal(guards, boundary);
    assert.equal(ackFilters.length, 0);
    assert.equal(entry.state, "pending");
    assert.equal(notices.length, boundary === 5 ? 1 : 0);
  }
});

test("a guard failure cannot schedule a delivery-error retry or terminal recovery", async () => {
  const entry = await queued(); failNotice = true; let guards = 0, reports = 0;
  await assert.rejects(drainBookingOutbox(1, { beforeWrite: async () => {
    if (++guards === 5) throw Error("fixture topology changed");
  }, onDeliveryError: () => { reports++; } }), NotificationGuardError);
  assert.equal(reports, 1); assert.equal(ackFilters.length, 0);
  assert.equal(entry.state, "pending"); assert.equal(entry.attempts, 1);
  entry.attempts = 5; entry.leaseUntil = new Date(0);
  await assert.rejects(drainBookingOutbox(1, { beforeWrite: async () => { throw Error("fixture"); } }), NotificationGuardError);
  assert.equal(entry.state, "pending");
});

test("protected booking is excluded from normal claims and final-attempt recovery", async () => {
  const entry = await queued(); rows[0].bookingId = "UA-0E0723";
  let before = clone(rows[0]);
  await drainBookingOutbox(20);
  assert.deepEqual(rows[0], before); assert.equal(notices.length, 0);
  entry.attempts = 5; entry.leaseUntil = new Date(0); before = clone(rows[0]);
  await drainBookingOutbox(20);
  assert.deepEqual(rows[0], before);
});

test("fixed activation cutoff excludes older bookings and resumes eligible pending work across cycles", async () => {
  const cutoff = new Date("2026-11-20T00:00:00.000Z");
  await queued(); rows[0].createdAt = new Date(+cutoff - 1);
  const before = clone(rows[0]);
  await drainBookingOutbox(1, { createdSince: cutoff });
  assert.deepEqual(rows[0], before);
  rows[0].createdAt = cutoff;
  assert.equal((await drainBookingOutbox(1, { createdSince: cutoff })).delivered, 1);
  assert.equal((await drainBookingOutbox(1, { createdSince: cutoff })).delivered, 0);
});

test("shutdown during a claim finishes that entry but claims no further work", async () => {
  rows = [{ ...pending(), notificationOutbox: await bookingEvent(binding, "created") }];
  const controller = new AbortController();
  beforeNotice = async () => { controller.abort(); };
  assert.equal((await drainBookingOutbox(20, { signal: controller.signal })).delivered, 1);
  assert.equal(rows[0].notificationOutbox.filter(entry => entry.state === "pending").length, 1);
});
