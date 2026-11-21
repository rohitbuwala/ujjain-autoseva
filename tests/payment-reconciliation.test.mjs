import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import mongoose from "mongoose";

// tsx loads these TypeScript modules via CommonJS so fixtures can replace their dependencies first.
const loadModule = createRequire(import.meta.url);

mongoose.connect = () => { throw new Error("Tests must not connect to MongoDB"); };
global.fetch = () => { throw new Error("Tests must not contact a provider"); };

function stub(path, exports) {
  const filename = loadModule.resolve(path);
  loadModule.cache[filename] = { id: filename, filename, loaded: true, exports };
}

const id = "65e000000000000000000001";
const orderId = "order_fixture";
const bookingId = "UA-TEST";
const marker = "__razorpay_pending__:1:fixture";
const order = {
  id: orderId, amount: 120000, currency: "INR", receipt: "booking_UA-TEST",
  notes: { bookingMongoId: id, bookingId, userId: "user-fixture" },
};
const capture = {
  id: "pay_fixture", order_id: orderId, amount: 120000, currency: "INR",
  status: "captured", captured: true, created_at: 1760000000,
};
const failure = { ...capture, id: "pay_failed", status: "failed", captured: false };
let row, readOrder, readPayments, providerReads, createCalls;
const REMOVE = Symbol("remove");
const same = (a, b) => b === null ? a == null : a instanceof Date && b instanceof Date ? +a === +b : a === b;

function matches(filter) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === "$or") return expected.some(matches);
    if (key === "$and") return expected.every(matches);
    const value = row[key];
    if (!expected || typeof expected !== "object" || expected instanceof Date) return same(value, expected);
    return Object.entries(expected).every(([op, comparison]) => {
      if (op === "$in") return comparison.some((candidate) => same(value, candidate));
      if (op === "$ne") return !same(value, comparison);
      if (op === "$gt") return value > comparison;
      if (op === "$lte") return value <= comparison;
      if (op === "$lt") return value < comparison;
      if (op === "$type") return comparison === "date" && value instanceof Date;
      throw new Error("Unrecognized query operator");
    });
  });
}

function evaluate(expr, previous) {
  if (expr === "$$NOW") return new Date();
  if (expr === "$$REMOVE") return REMOVE;
  if (typeof expr === "string" && expr.startsWith("$")) return previous[expr.slice(1)];
  if (!expr || typeof expr !== "object" || expr instanceof Date) return expr;
  if ("$literal" in expr) return expr.$literal;
  if ("$ifNull" in expr) return evaluate(expr.$ifNull[0], previous) ?? evaluate(expr.$ifNull[1], previous);
  if ("$cond" in expr) return evaluate(expr.$cond[evaluate(expr.$cond[0], previous) ? 1 : 2], previous);
  if ("$or" in expr) return expr.$or.some((value) => evaluate(value, previous));
  if ("$and" in expr) return expr.$and.every((value) => evaluate(value, previous));
  if ("$eq" in expr) return same(...expr.$eq.map((value) => evaluate(value, previous)));
  if ("$ne" in expr) return !same(...expr.$ne.map((value) => evaluate(value, previous)));
  if ("$in" in expr) return expr.$in[1].includes(evaluate(expr.$in[0], previous));
  throw new Error("Unrecognized aggregation expression");
}

function apply(filter, change) {
  if (!matches(filter)) return false;
  const old = row;
  row = { ...row };
  if (Array.isArray(change)) {
    for (const [key, expression] of Object.entries(change[0].$set)) {
      const value = evaluate(expression, old);
      if (value === REMOVE) delete row[key];
      else row[key] = value;
    }
  } else {
    Object.assign(row, change.$set);
    for (const [key, increment] of Object.entries(change.$inc ?? {})) row[key] = (row[key] ?? 0) + increment;
    for (const key of Object.keys(change.$unset ?? {})) delete row[key];
  }
  return true;
}

function query(value) {
  return { select() { return this; }, lean: async () => value };
}

stub("../models/Booking.ts", {
  findOneAndUpdate(filter, change) { return query(apply(filter, change) ? { ...row } : null); },
  findOne(filter) { return query(matches(filter) ? { ...row } : null); },
  updateOne: async (filter, change) => ({ matchedCount: apply(filter, change) ? 1 : 0 }),
});

const gateway = loadModule("../lib/razorpay.ts");
stub("../lib/razorpay.ts", {
  ...gateway,
  fetchRazorpayOrder: async (_id, signal) => { providerReads++; return readOrder(signal); },
  findRazorpayOrderByReceipt: async (_receipt, signal) => { providerReads++; return readOrder(signal); },
  fetchRazorpayOrderPayments: async (_id, signal) => { providerReads++; return readPayments(signal); },
  createRazorpayOrder: () => { createCalls++; throw new Error("Reconciliation must not create orders"); },
});

const { runPaymentReconciliation } = loadModule("../lib/payment-reconciliation.ts");
const { recordFailedAttempt, inactiveBookingUpdate } = loadModule("../lib/booking-payments.ts");
const { GET } = loadModule("../app/api/internal/payments/reconcile/route.ts");

function reset(overrides = {}) {
  row = {
    _id: id, bookingId, userId: "user-fixture", status: "confirmed", paymentMethod: "online",
    paymentStatus: "online_order_created", paymentAmount: 1200, paymentCurrency: "INR",
    razorpayOrderId: orderId, reconciliationNextAt: new Date(0), ...overrides,
  };
  readOrder = async () => order;
  readPayments = async () => [capture];
  providerReads = 0;
  createCalls = 0;
}

test.afterEach(() => assert.equal(createCalls ?? 0, 0));

test("concurrent workers claim once and record a capture once", async () => {
  reset();
  const releases = Promise.withResolvers();
  readOrder = () => releases.promise;
  const first = runPaymentReconciliation();
  const second = await runPaymentReconciliation();
  assert.equal(second.claimed, 0);
  releases.resolve(order);
  assert.equal((await first).captured, 1);
  assert.equal(row.razorpayPaymentId, capture.id);
  assert.equal(row.paymentStatus, "paid");
  assert.equal(providerReads, 2);
  assert.equal(row.reconciliationLeaseToken, undefined);
});

test("an abandoned lease can be reclaimed and the old token cannot finish it", async () => {
  reset({ reconciliationLeaseToken: "abandoned", reconciliationLeaseExpiresAt: new Date(0), reconciliationAttempts: 1 });
  assert.equal((await runPaymentReconciliation()).captured, 1);
  assert.equal(row.reconciliationAttempts, 2);
  assert.equal(row.reconciliationLeaseToken, undefined);
});

test("a superseded worker cannot persist capture or release a newer lease", async () => {
  reset();
  readPayments = async () => {
    row.reconciliationLeaseToken = "new-worker";
    row.reconciliationLeaseExpiresAt = new Date(Date.now() + 60_000);
    return [capture];
  };
  assert.equal((await runPaymentReconciliation()).changed, 1);
  assert.equal(row.paymentStatus, "online_order_created");
  assert.equal(row.reconciliationLeaseToken, "new-worker");
});

test("failed attempt schedules an open legacy order and a later capture still succeeds", async () => {
  reset({ reconciliationNextAt: undefined });
  await recordFailedAttempt({ ...row }, failure);
  assert.ok(row.reconciliationNextAt instanceof Date);
  assert.equal(row.paymentStatus, "online_order_created");
  readPayments = async () => [failure];
  assert.equal((await runPaymentReconciliation()).retry, 1);
  assert.equal(row.reconciliationLastError, "unsettled_payment");
  assert.ok(+row.reconciliationNextAt > Date.now());
  row.reconciliationNextAt = new Date(0);
  readPayments = async () => [failure, capture];
  assert.equal((await runPaymentReconciliation()).captured, 1);
  assert.equal(row.reconciliationLastError, undefined);
});

test("cancelled reservations are scheduled and captured without reactivation", async () => {
  reset({ razorpayOrderId: marker, reconciliationNextAt: undefined });
  apply({ _id: id }, inactiveBookingUpdate({ status: "cancelled" }));
  assert.ok(row.reconciliationNextAt instanceof Date);
  assert.equal((await runPaymentReconciliation()).operator_review, 1);
  assert.equal(row.razorpayOrderId, orderId);
  assert.equal(row.status, "cancelled");
  assert.equal(row.paymentStatus, "paid");
  assert.equal(row.paymentReviewRequired, true);
  assert.equal(row.reconciliationNeedsReview, true);
});

test("a rejected legacy booking with an unscheduled order is discovered", async () => {
  reset({ status: "rejected", reconciliationNextAt: undefined });
  assert.equal((await runPaymentReconciliation()).operator_review, 1);
  assert.equal(row.status, "rejected");
  assert.equal(row.razorpayPaymentId, capture.id);
});

test("wrong order amount, currency, or recipient require review", async () => {
  for (const mismatch of [{ amount: 119999 }, { currency: "USD" }, { notes: { ...order.notes, userId: "other" } }]) {
    reset();
    readOrder = async () => ({ ...order, ...mismatch });
    assert.equal((await runPaymentReconciliation()).operator_review, 1);
    assert.equal(row.reconciliationLastError, "association_mismatch");
    assert.equal(row.paymentStatus, "online_order_created");
  }
});

test("wrong capture amount or currency cannot mark a booking paid", async () => {
  for (const mismatch of [{ amount: 119999 }, { currency: "USD" }]) {
    reset();
    readPayments = async () => [{ ...capture, ...mismatch }];
    assert.equal((await runPaymentReconciliation()).operator_review, 1);
    assert.equal(row.reconciliationLastError, "invalid_payments");
    assert.equal(row.paymentStatus, "online_order_created");
  }
});

test("missing order retries and ambiguous receipt requires review without replacing either reservation", async () => {
  reset({ razorpayOrderId: marker });
  readOrder = async () => null;
  assert.equal((await runPaymentReconciliation()).retry, 1);
  assert.equal(row.razorpayOrderId, marker);
  assert.equal(row.reconciliationLastError, "missing_order");
  row.reconciliationNextAt = new Date(0);
  readOrder = async () => { throw new gateway.RazorpayReadError("ambiguous_order"); };
  assert.equal((await runPaymentReconciliation()).operator_review, 1);
  assert.equal(row.razorpayOrderId, marker);
  assert.equal(row.reconciliationLastError, "ambiguous_order");
});

test("provider timeout is sanitized and scheduled to retry", async () => {
  reset();
  const timeout = AbortSignal.timeout;
  AbortSignal.timeout = () => timeout(10);
  readOrder = (signal) => new Promise((resolve, reject) => {
    const fallback = setTimeout(resolve, 500, order);
    signal.addEventListener("abort", () => {
      clearTimeout(fallback);
      reject(signal.reason);
    }, { once: true });
  });
  try {
    assert.equal((await runPaymentReconciliation()).retry, 1);
    assert.equal(row.reconciliationLastError, "provider_timeout");
  } finally {
    AbortSignal.timeout = timeout;
  }
});

test("retry exhaustion preserves evidence and does not rediscover the reviewed booking", async () => {
  reset({ razorpayOrderId: marker, reconciliationAttempts: 7 });
  readOrder = async () => null;
  assert.equal((await runPaymentReconciliation()).operator_review, 1);
  assert.equal(row.reconciliationAttempts, 8);
  assert.equal(row.reconciliationNeedsReview, true);
  assert.equal(row.razorpayOrderId, marker);
  assert.equal(row.reconciliationNextAt, undefined);
  assert.equal((await runPaymentReconciliation()).claimed, 0);
});

test("scheduler rejects disabled, missing, and wrong credentials before accessing MongoDB", async () => {
  const names = ["PAYMENT_RECONCILIATION_ENABLED", "CRON_SECRET"];
  const before = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  const input = (authorization) => new Request("https://fixture.test/api/internal/payments/reconcile", {
    headers: authorization ? { authorization } : {},
  });
  try {
    delete process.env.PAYMENT_RECONCILIATION_ENABLED;
    assert.equal((await GET(input())).status, 404);
    process.env.PAYMENT_RECONCILIATION_ENABLED = "true";
    delete process.env.CRON_SECRET;
    assert.equal((await GET(input("Bearer wrong"))).status, 401);
    process.env.CRON_SECRET = "local-test-only-synthetic-32-byte-secret";
    assert.equal((await GET(input())).status, 401);
    const result = await GET(input("Bearer wrong"));
    assert.equal(result.status, 401);
    assert.equal(result.headers.get("cache-control"), "no-store");
    assert.deepEqual(await result.json(), { error: "Unauthorized" });
  } finally {
    for (const name of names) {
      if (before[name] === undefined) delete process.env[name];
      else process.env[name] = before[name];
    }
  }
});
