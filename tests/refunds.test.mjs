import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createRequire } from "node:module";
import { beforeEach, test } from "node:test";
import mongoose from "mongoose";

const load = createRequire(import.meta.url);
function replace(path, exports) {
  const filename = load.resolve(path);
  load.cache[filename] = { id: filename, filename, loaded: true, exports };
}

const customer = "65e000000000000000000001";
const admin = "65e000000000000000000002";
const other = "65e000000000000000000003";
const bookingId = "65e000000000000000000004";
const operationKey = "b8a30d3c-4644-48f9-94ae-80a129370001";
let booking, balance, ledger, identity, currentAdmin, failDecisionWrite;
let providerPayment, providerRefunds, readPayment, readRefundPage;
let inbox, readSingleRefund, failInboxTransaction, failInboxIntake;
let intents, failIntentWrite;
let queue = Promise.resolve();
mongoose.connect = () => assert.fail("Unexpected database connection");
globalThis.fetch = () => assert.fail("Unexpected network call");
mongoose.connection.transaction = async (action) => {
  // Serialize fixture transactions and apply rollback semantics in memory.
  const previous = queue;
  let release;
  queue = new Promise((resolve) => { release = resolve; });
  await previous;
  const snapshot = structuredClone({ balance, ledger, inbox, intents });
  try { return await action({ fixture: true }); }
  catch (error) { ({ balance, ledger, inbox, intents } = snapshot); throw error; }
  finally { release(); }
};

function matches(row, filter) {
  if (!row) return false;
  return Object.entries(filter).every(([key, value]) => {
    if (key === "$or") return value.some((part) => matches(row, part));
    if (key === "$and") return value.every((part) => matches(row, part));
    if (key === "$expr") {
      const [[, , amount]] = value.$lte.map((entry) => entry?.$add);
      return row.reservedPaise + row.processedPaise + amount <= row.capturedPaise;
    }
    if (value && typeof value === "object" && "$in" in value) return value.$in.includes(row[key]);
    if (value && typeof value === "object" && "$gte" in value) return row[key] >= value.$gte;
    if (value && typeof value === "object" && "$lte" in value) return row[key] <= value.$lte;
    if (value && typeof value === "object" && "$gt" in value) return row[key] > value.$gt;
    return value === null ? row[key] == null : row[key] === value;
  });
}

function result(read) {
  return {
    select() { return this; }, session(session) { assert.ok(session.fixture); return this; },
    sort() { return this; }, skip() { return this; }, limit() { return this; },
    async lean() { return structuredClone(read()); },
  };
}

function apply(row, change) {
  Object.assign(row, change.$set);
  for (const key of Object.keys(change.$unset ?? {})) delete row[key];
  for (const [key, amount] of Object.entries(change.$inc ?? {})) row[key] = (row[key] ?? 0) + amount;
  if (change.$push?.audit) row.audit.push(change.$push.audit);
}

replace("../models/Booking.ts", {
  findOne: (filter) => result(() => matches(booking, filter) ? booking : null),
  find: (filter) => result(() => matches(booking, filter) ? [booking] : []),
});
replace("../models/User.ts", { exists: ({ _id, role }) => {
  const answer = Promise.resolve(_id === currentAdmin && role === "admin");
  answer.session = (session) => { assert.ok(session.fixture); return answer; };
  return answer;
} });
const razorpay = load("../lib/razorpay.ts");
replace("../lib/razorpay.ts", {
  ...razorpay,
  fetchRazorpayPaymentForRefundReview: (...args) => readPayment(...args),
  readRazorpayRefundPage: (...args) => readRefundPage(...args),
  fetchRazorpayRefundForReview: (...args) => readSingleRefund(...args),
});
replace("../lib/db.ts", async () => {});
replace("../lib/auth-utils.ts", {
  requireSession: async () => identity
    ? { session: { user: identity }, response: null }
    : { session: null, response: new Response(null, { status: 401 }) },
});
replace("../models/Refund.ts", {
  __esModule: true,
  default: {
    findOne: (filter) => result(() => ledger.find((row) => matches(row, filter))),
    find: (filter) => result(() => ledger.filter((row) => matches(row, filter))),
    findById: (id) => result(() => ledger.find((row) => row._id === id)),
    create: async ([refund], { session }) => {
      assert.ok(session.fixture);
      ledger.push(refund);
      return [{ toObject: () => structuredClone(refund) }];
    },
    findOneAndUpdate: (filter, change, { session }) => {
      assert.ok(session.fixture);
      if (failDecisionWrite) return result(() => null);
      const row = ledger.find((item) => matches(item, filter));
      if (row) { Object.assign(row, change.$set); row.audit.push(change.$push.audit); }
      return result(() => row);
    },
    async updateOne(filter, change, { session }) {
      assert.ok(session.fixture);
      const row = ledger.find((item) => matches(item, filter));
      if (row) apply(row, change);
      return { matchedCount: row ? 1 : 0 };
    },
  },
  RefundBalance: {
    find: (filter) => result(() => matches(balance, filter) ? [balance] : []),
    findOne: (filter) => result(() => matches(balance, filter) ? balance : null),
    findOneAndUpdate(filter, change) {
      if (!matches(balance, filter)) return result(() => null);
      apply(balance, change);
      const claimed = structuredClone(balance);
      return result(() => claimed);
    },
    async updateOne(filter, change, { session, upsert }) {
      assert.ok(session.fixture);
      if (upsert && !balance) { balance = { ...change.$setOnInsert }; return { matchedCount: 0 }; }
      if (!matches(balance, filter)) return { matchedCount: 0 };
      apply(balance, change);
      return { matchedCount: 1 };
    },
  },
});

const webhookModel = load("../models/RefundWebhookEvent.ts");
replace("../models/RefundWebhookEvent.ts", {
  __esModule: true,
  ...webhookModel,
  default: {
    find: () => result(() => inbox),
    findById: (id) => result(() => inbox.find((item) => item._id === id)),
    async updateOne(filter, change, options) {
      if ((options?.session && failInboxTransaction) || (options?.upsert && failInboxIntake)) throw new Error("fixture storage unavailable");
      const row = inbox.find((item) => matches(item, filter));
      if (row) {
        apply(row, change);
        return { matchedCount: 1, upsertedCount: 0 };
      }
      if (options?.upsert) {
        inbox.push(structuredClone(change.$setOnInsert));
        return { matchedCount: 0, upsertedCount: 1 };
      }
      return { matchedCount: 0, upsertedCount: 0 };
    },
    findOneAndUpdate(filter, change) {
      const row = inbox.find((item) => matches(item, filter));
      if (!row) return result(() => null);
      apply(row, change);
      const claim = structuredClone(row);
      return result(() => claim);
    },
  },
});

replace("../models/RefundSubmission.ts", {
  __esModule: true,
  default: {
    findById: (id) => result(() => intents.find((row) => row._id === id)),
    findOne: (filter) => result(() => intents.find((row) => matches(row, filter))),
    async create([row], { session }) {
      assert.ok(session.fixture);
      assert.ok(!intents.some((intent) => intent._id === row._id));
      intents.push(row);
      return [{ toObject: () => structuredClone(row) }];
    },
    async updateOne(filter, change) {
      if (failIntentWrite) throw new Error("fixture intent write failed");
      const row = intents.find((item) => matches(item, filter));
      if (row) apply(row, change);
      return { matchedCount: row ? 1 : 0 };
    },
  },
});

const { requestRefund, decideRefund, reconcileRefundBalance } = load("../lib/refunds.ts");
const { prepareRefundExecution, claimRefundSubmission, recoverRefundSubmission } = load("../lib/refund-submission.ts");
const submissionRoute = load("../app/api/admin/refunds/[id]/submission/route.ts");
const customerRoute = load("../app/api/refunds/route.ts");
const adminRoute = load("../app/api/admin/refunds/[id]/route.ts");
const adminList = load("../app/api/admin/refunds/route.ts");
const reconcileRoute = load("../app/api/admin/refunds/[id]/reconcile/route.ts");
const webhook = load("../app/api/payments/razorpay/webhook/route.ts");
const operatorRoute = load("../app/api/admin/refunds/webhook-inbox/route.ts");
const { processRefundWebhook } = load("../lib/refund-webhook-inbox.ts");
const payload = { bookingId, operationKey, reason: "Cancelled ride" };
const approve = (amountPaise) => ({ action: "approve", amountPaise, reason: "Verified capture" });
const providerRefund = (overrides = {}) => ({
  id: "rfnd_fixture", payment_id: "pay_fixture", currency: "INR", amount: 2000, status: "pending", ...overrides,
});
const reject = { action: "reject", reason: "Ineligible after review" };
const create = (extra = {}) => requestRefund(customer, { ...payload, ...extra });
const withRequest = (method, body, expected) => new Request("https://fixture.test/api/refunds", {
  method, body: body ? JSON.stringify(body) : undefined,
  headers: expected ? { "X-Refund-Account": expected } : undefined,
});
const decide = (id, body) => adminRoute.PATCH(withRequest("PATCH", body), { params: Promise.resolve({ id }) });

beforeEach(() => {
  ledger = []; balance = undefined; identity = { id: customer, role: "user" }; currentAdmin = admin;
  failDecisionWrite = false;
  inbox = []; failInboxTransaction = false; failInboxIntake = false;
  intents = []; failIntentWrite = false;
  readSingleRefund = async () => { throw new razorpay.RazorpayReadError("missing_order"); };
  booking = { _id: bookingId, bookingId: "UA-FIXTURE", userId: customer, status: "cancelled", paymentStatus: "paid",
    paymentMethod: "online", paymentAmount: 100, paymentCurrency: "INR", paidAt: new Date(),
    razorpayOrderId: "order_fixture", razorpayPaymentId: "pay_fixture", paymentReviewRequired: true };
  providerPayment = { id: "pay_fixture", order_id: "order_fixture", captured: true, status: "captured",
    amount: 10000, amount_refunded: 0, currency: "INR" };
  providerRefunds = [];
  readPayment = async () => ({ ...providerPayment });
  readRefundPage = async (_paymentId, skip, count) => {
    const items = providerRefunds.slice(skip, skip + count);
    return { entity: "collection", count: items.length, items };
  };
});

test("manual full approval reserves the verified amount and leaves the booking paid", async () => {
  const { refund } = await create();
  assert.deepEqual(refund.audit.map((entry) => entry.status), ["requested", "under_review"]);
  const approved = await decideRefund(admin, refund._id, approve(10000));
  assert.equal(approved.type, "full");
  assert.equal(approved.status, "approved");
  assert.equal(balance.reservedPaise, 10000);
  assert.equal(booking.paymentStatus, "paid");
  assert.equal(approved.processingAt, undefined);
});

test("admin can choose a partial amount different from the requested amount", async () => {
  const { refund } = await create({ requestedPaise: 7000 });
  const decision = await decideRefund(admin, refund._id, approve(3500));
  assert.equal(decision.type, "partial");
  assert.equal(decision.approvedPaise, 3500);
  assert.equal(balance.reservedPaise, 3500);
});

test("rejecting releases the active slot and records a reason", async () => {
  const { refund } = await create();
  const decision = await decideRefund(admin, refund._id, reject);
  assert.equal(decision.adminReason, reject.reason);
  assert.equal(decision.status, "rejected");
  assert.equal(balance.activeRefundId, undefined);
  await assert.rejects(decideRefund(admin, refund._id, approve(3500)), { status: 409 });
  await create({ operationKey: "b8a30d3c-4644-48f9-94ae-80a129370002" });
  assert.equal(ledger.length, 2);
});

test("request retries replay the original, and distinct active requests conflict", async () => {
  const results = await Promise.all([create(), create()]);
  assert.equal(results.filter((entry) => entry.created).length, 1);
  assert.equal(ledger.length, 1);
  await assert.rejects(create({ reason: "Another reason" }), { status: 409 });
  await assert.rejects(create({ operationKey: "b8a30d3c-4644-48f9-94ae-80a129370002" }), { status: 409 });
});

test("concurrent approvals and decision replays reserve the balance once", async () => {
  const { refund } = await create();
  const results = await Promise.allSettled([decideRefund(admin, refund._id, approve(7000)), decideRefund(other, refund._id, approve(7000))]);
  assert.equal(results.filter((entry) => entry.status === "fulfilled").length, 1);
  assert.equal(results.find((entry) => entry.status === "rejected").reason.status, 409);
  assert.equal((await decideRefund(ledger[0].adminId, refund._id, approve(7000))).status, "approved");
  assert.equal(balance.reservedPaise, 7000);
});

test("over-limit requests and approvals account for prior reserved and processed amounts", async () => {
  await assert.rejects(create({ requestedPaise: 10001 }), { status: 409 });
  assert.equal(balance, undefined);
  const { refund } = await create();
  balance.reservedPaise = 3000;
  balance.processedPaise = 2000;
  ledger.push({ ...refund, _id: "prior-approved", status: "approved", approvedPaise: 3000 },
    { ...refund, _id: "prior-processed", status: "processed", approvedPaise: 2000, razorpayRefundId: "rfnd_fixture" });
  providerPayment.amount_refunded = 2000;
  providerRefunds = [providerRefund({ status: "processed" })];
  await assert.rejects(decideRefund(admin, refund._id, approve(5001)), { status: 409 });
  assert.equal(ledger[0].status, "under_review");
  await decideRefund(admin, refund._id, approve(5000));
  assert.equal(balance.processedPaise + balance.reservedPaise, 10000);
});

test("uncaptured, unverified, and non-cancelled bookings are ineligible", async () => {
  const verified = { ...booking };
  for (const change of [{ status: "confirmed" }, { paymentStatus: "failed" }, { paidAt: null },
    { razorpayPaymentId: "invalid" }, { paymentCurrency: "USD" }]) {
    booking = { ...verified, ...change };
    await assert.rejects(create(), { status: 409 });
  }
  booking = verified;
  const { refund } = await create();
  booking.razorpayPaymentId = "pay_different";
  await assert.rejects(decideRefund(admin, refund._id, approve(100)), { status: 409 });
});

test("customer APIs isolate accounts and redact internal refund fields", async () => {
  const created = await customerRoute.POST(withRequest("POST", payload));
  assert.equal(created.status, 201);
  assert.equal((await customerRoute.POST(withRequest("POST", payload))).status, 200);
  const response = await customerRoute.GET(withRequest("GET"));
  const [row] = (await response.json()).items;
  for (const field of ["adminId", "operationKey", "razorpayPaymentId", "customerId", "audit"]) assert.equal(row[field], undefined);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  identity = { id: other, role: "user" };
  assert.deepEqual((await (await customerRoute.GET(withRequest("GET"))).json()).items, []);
  assert.equal((await customerRoute.GET(withRequest("GET", undefined, customer))).status, 401);
  assert.equal((await customerRoute.POST(withRequest("POST", payload))).status, 404);
  identity = null;
  assert.equal((await customerRoute.GET(withRequest("GET"))).status, 401);
});

test("only a current admin can decide and no execution transitions are exposed", async () => {
  const { refund } = await create();
  assert.equal((await decide(refund._id, approve(10000))).status, 403);
  identity = { id: admin, role: "admin" }; currentAdmin = other;
  assert.equal((await decide(refund._id, approve(10000))).status, 403);
  currentAdmin = admin;
  for (const body of [{ action: "processing" }, { action: "processed" }, approve(1.01)]) {
    assert.equal((await decide(refund._id, body)).status, 400);
  }
  assert.equal((await decide(refund._id, approve(10000))).status, 200);
  assert.equal((await decide(refund._id, reject)).status, 409);
  assert.equal(ledger[0].status, "approved");
  assert.equal(balance.reservedPaise, 10000);
});

test("a failed decision write rolls back its balance reservation", async () => {
  const { refund } = await create();
  failDecisionWrite = true;
  await assert.rejects(decideRefund(admin, refund._id, approve(5000)), { status: 409 });
  assert.equal(balance.reservedPaise, 0);
  assert.equal(balance.activeRefundId, refund._id);
  assert.equal(ledger[0].status, "under_review");
});

test("admin queue exposes payment evidence and balances, with decided requests in history", async () => {
  const { refund } = await create({ requestedPaise: 7000 });
  assert.equal((await adminList.GET(withRequest("GET"))).status, 403);
  identity = { id: admin, role: "admin" };
  const pending = await adminList.GET(withRequest("GET"));
  const [row] = (await pending.json()).items;
  assert.equal(row.paymentId, "pay_fixture");
  assert.equal(row.capturedPaise, 10000);
  assert.equal(row.availablePaise, 10000);
  assert.equal(row.eligible, true);
  assert.equal(row.operationKey, undefined);
  await decideRefund(admin, refund._id, approve(3000));
  assert.deepEqual((await (await adminList.GET(withRequest("GET"))).json()).items, []);
  const history = await adminList.GET(new Request("https://fixture.test/api/admin/refunds?scope=all"));
  const [approved] = (await history.json()).items;
  assert.equal(approved.reservedPaise, 3000);
  assert.equal(approved.audit.at(-1).status, "approved");
});

test("provider pending refunds matched to the ledger do not reduce available balance twice", async () => {
  const { refund } = await create();
  ledger.push({ ...refund, _id: "prior-processing", status: "processing", approvedPaise: 2000, razorpayRefundId: "rfnd_fixture" });
  balance.reservedPaise = 2000;
  providerRefunds = [providerRefund()];
  providerPayment.amount_refunded = 2000;

  const snapshot = await reconcileRefundBalance(refund._id);
  assert.equal(snapshot.status, "verified");
  assert.equal(snapshot.availablePaise, 8000);
  assert.equal(snapshot.pendingPaise, 2000);
  await decideRefund(admin, refund._id, approve(8000));
  assert.equal(balance.reservedPaise, 10000);
});

test("external pending and processed refunds block approval and persist an operator-review reason", async () => {
  const { refund } = await create();
  for (const status of ["pending", "processed"]) {
    providerRefunds = [providerRefund({ status })];
    providerPayment.amount_refunded = status === "processed" ? 2000 : 0;
    const snapshot = await reconcileRefundBalance(refund._id);
    assert.equal(snapshot.status, "needs_review");
    assert.equal(snapshot.issue, "external_refunds");
    assert.equal(snapshot.externalRefundCount, 1);
    assert.equal(snapshot.availablePaise, null);
    await assert.rejects(decideRefund(admin, refund._id, approve(100)), { status: 409 });
    assert.equal(balance.providerIssue, "external_refunds");
    assert.equal(balance.reservedPaise, 0);
  }
});

test("duplicate refunds, invalid IDs, wrong currency, and ambiguous states fail closed", async () => {
  const { refund } = await create();
  for (const items of [
    [providerRefund(), providerRefund()],
    [providerRefund({ id: "invalid" })],
    [providerRefund({ currency: "USD" })],
    [providerRefund({ payment_id: "pay_other" })],
    [providerRefund({ status: "unknown" })],
    [providerRefund({ amount: 1.5 })],
  ]) {
    providerRefunds = items;
    const snapshot = await reconcileRefundBalance(refund._id);
    assert.equal(snapshot.issue, "invalid_refunds");
    assert.equal(snapshot.availablePaise, null);
  }
  providerRefunds = [];
  for (const change of [{ currency: "USD" }, { amount: 9999 }, { order_id: "order_other" }]) {
    const original = providerPayment;
    providerPayment = { ...original, ...change };
    assert.equal((await reconcileRefundBalance(refund._id)).issue, "capture_mismatch");
    providerPayment = original;
  }
  providerPayment.amount_refunded = 1;
  assert.equal((await reconcileRefundBalance(refund._id)).issue, "incomplete_history");
});

test("a timeout invalidates the previous verified balance and prevents approval", async () => {
  const { refund } = await create();
  assert.equal((await reconcileRefundBalance(refund._id)).status, "verified");
  readRefundPage = async (_id, _skip, _count, signal) => {
    assert.ok(signal instanceof AbortSignal);
    throw new DOMException("provider fixture timeout", "TimeoutError");
  };
  await assert.rejects(decideRefund(admin, refund._id, approve(100)), { status: 503 });
  assert.equal(balance.providerCheckStatus, "needs_review");
  assert.equal(balance.providerIssue, "unavailable");
  assert.equal(balance.providerAvailablePaise, undefined);
  assert.equal(balance.reservedPaise, 0);
});

test("refund history uses multiple pages and rejects a changing first page", async () => {
  const { refund } = await create();
  providerRefunds = Array.from({ length: 51 }, (_, index) => providerRefund({
    id: `rfnd_fixture${index}`, amount: 1, status: "failed",
  }));
  const originalRead = readRefundPage;
  const pages = [];
  readRefundPage = async (...args) => { pages.push(args[1]); return originalRead(...args); };
  assert.equal((await reconcileRefundBalance(refund._id)).externalRefundCount, 51);
  assert.deepEqual(pages, [0, 50, 0]);
  readRefundPage = async (...args) => {
    const page = await originalRead(...args);
    if (args[1] === 50) providerRefunds.unshift(providerRefund({ id: "rfnd_recent" }));
    return page;
  };
  assert.equal((await reconcileRefundBalance(refund._id)).issue, "incomplete_history");
});

test("Razorpay refund lookup transport uses GET only and disables caching and redirects", async () => {
  const keyNames = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"];
  const saved = keyNames.map((key) => process.env[key]);
  const originalFetch = globalThis.fetch;
  const urls = [];
  try {
    keyNames.forEach((key) => { process.env[key] = "test_fixture"; });
    globalThis.fetch = async (request, options) => {
      const url = new URL(request);
      assert.equal(url.origin, "https://api.razorpay.com");
      assert.equal(options.method ?? "GET", "GET");
      assert.equal(options.body, undefined);
      assert.equal(options.cache, "no-store");
      assert.equal(options.redirect, "error");
      urls.push(url.pathname + url.search);
      return Response.json({});
    };
    const { signal } = new AbortController();
    await razorpay.fetchRazorpayPaymentForRefundReview("pay_fixture", signal);
    await razorpay.readRazorpayRefundPage("pay_fixture", 50, 50, signal);
    await razorpay.fetchRazorpayRefundForReview("pay_fixture", "rfnd_fixture", signal);
    assert.deepEqual(urls, ["/v1/payments/pay_fixture", "/v1/payments/pay_fixture/refunds?count=50&skip=50",
      "/v1/payments/pay_fixture/refunds/rfnd_fixture"]);
  } finally {
    globalThis.fetch = originalFetch;
    keyNames.forEach((key, index) => {
      if (saved[index] === undefined) delete process.env[key];
      else process.env[key] = saved[index];
    });
  }
});

test("a delayed check cannot replace a newer reconciliation or authorize a reservation", async () => {
  const { refund } = await create();
  let unblock, entered;
  const blocked = new Promise((resolve) => { unblock = resolve; });
  const started = new Promise((resolve) => { entered = resolve; });
  let reads = 0;
  readPayment = async () => {
    if (++reads === 1) { entered(); await blocked; }
    return { ...providerPayment };
  };
  const approval = assert.rejects(decideRefund(admin, refund._id, approve(100)), { status: 409 });
  await started;
  const latest = await reconcileRefundBalance(refund._id);
  unblock();
  await approval;
  assert.equal(balance.providerCheckVersion, latest.checkVersion);
  assert.equal(balance.providerCheckStatus, "verified");
  assert.equal(balance.reservedPaise, 0);
});

test("reconciliation endpoint requires a current admin and redacts internals", async () => {
  const { refund } = await create();
  const reconcile = () => reconcileRoute.POST(withRequest("POST"), { params: Promise.resolve({ id: refund._id }) });
  assert.equal((await reconcile()).status, 403);
  identity = null;
  assert.equal((await reconcile()).status, 401);
  identity = { id: admin, role: "admin" };
  currentAdmin = other;
  assert.equal((await reconcile()).status, 403);
  currentAdmin = admin;
  const response = await reconcile();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), { status: "verified", issue: null, availablePaise: 10000,
    processedPaise: 0, pendingPaise: 0, externalRefundCount: 0 });
});

test("only a current admin can prepare once, with no provider writes or status advancement", async () => {
  const { refund } = await create();
  await decideRefund(admin, refund._id, approve(10000));
  await assert.rejects(prepareRefundExecution(customer, refund._id), { status: 403 });
  providerRefunds = [providerRefund()];
  await assert.rejects(prepareRefundExecution(admin, refund._id), { status: 409 });
  assert.equal(ledger[0].executionPreparedAt, undefined);
  providerRefunds = [];
  const attempts = await Promise.allSettled([
    prepareRefundExecution(admin, refund._id),
    prepareRefundExecution(admin, refund._id),
  ]);
  assert.equal(attempts.filter((result) => result.status === "fulfilled" && result.value.status === "prepared").length, 1);
  for (const result of attempts) {
    if (result.status === "rejected") assert.equal(result.reason.status, 409);
  }
  assert.equal(intents.length, 1);
  assert.equal(ledger[0].executionIdempotencyKey, refund.operationKey);
  assert.equal(ledger[0].executionPreparedBy, admin);
  assert.equal(ledger[0].status, "approved");
  assert.equal(ledger[0].razorpayRefundId, undefined);
  assert.equal(balance.reservedPaise, 10000);
  assert.equal((await prepareRefundExecution(admin, refund._id)).status, "already_prepared");
});

const webhookSecret = "fixture-secret";
const webhookAccount = "acc_fixture";
process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
process.env.RAZORPAY_REFUND_WEBHOOK_ACCOUNT_ID = webhookAccount;

function webhookBody(event = "refund.processed", change = {}) {
  const status = event === "refund.created" ? "pending" : event.split(".")[1];
  return {
    entity: "event", event, account_id: webhookAccount, created_at: 1760000000,
    payload: { refund: { entity: { entity: "refund", ...providerRefund({ status, ...change }), notes: { secret: "discard" } } } },
  };
}

function deliver(body, eventId = "event_fixture", signature) {
  const raw = JSON.stringify(body);
  const headers = {
    "x-razorpay-signature": signature ?? createHmac("sha256", webhookSecret).update(raw).digest("hex"),
  };
  if (eventId !== null) headers["x-razorpay-event-id"] = eventId;
  return webhook.POST(new Request("https://fixture.test/api/payments/razorpay/webhook", { method: "POST", headers, body: raw }));
}

async function linkedRefund() {
  const { refund } = await create();
  await decideRefund(admin, refund._id, approve(2000));
  ledger[0].razorpayRefundId = "rfnd_fixture";
}

function providerState(status) {
  providerRefunds = [providerRefund({ status })];
  providerPayment.amount_refunded = status === "processed" ? 2000 : 0;
}

test("refund webhook rejects invalid raw-body signatures, event IDs, accounts and malformed data", async () => {
  const body = webhookBody();
  assert.equal((await deliver(body, "event_fixture", "0".repeat(64))).status, 400);
  assert.equal((await deliver(body, null)).status, 400);
  assert.equal((await deliver({ ...body, account_id: "acc_other" })).status, 400);
  for (const change of [{ amount: 0 }, { amount: 1.5 }, { currency: "USD" }, { id: "invalid" },
    { payment_id: "invalid" }, { status: "pending" }]) {
    assert.equal((await deliver(webhookBody("refund.processed", change))).status, 400);
  }
  assert.equal(inbox.length, 0);
  failInboxIntake = true;
  assert.equal((await deliver(body)).status, 500);
  assert.equal(inbox.length, 0);
});

test("identical deliveries persist once and conflicting reuse stays in review", async () => {
  const body = webhookBody();
  const responses = await Promise.all([deliver(body), deliver(body)]);
  assert.ok(responses.every((response) => response.status === 200));
  assert.equal(inbox.length, 1);
  assert.equal(inbox[0].state, "queued");
  assert.ok(inbox[0].createdAt instanceof Date);
  assert.doesNotMatch(JSON.stringify(inbox), /discard|fixture-secret|payload/);
  assert.equal((await deliver(webhookBody("refund.failed"))).status, 200);
  assert.equal(inbox[0].issue, "event_id_conflict");
  assert.equal(inbox[0].state, "review");
  assert.equal(await processRefundWebhook(inbox[0]._id, admin), false);
});

test("a verified created event keeps the reservation and a processed event moves it once", async () => {
  await linkedRefund();
  providerState("pending");
  await deliver(webhookBody("refund.created"), "event_created");
  assert.equal(await processRefundWebhook(), true);
  assert.equal(ledger[0].status, "processing");
  assert.equal(balance.reservedPaise, 2000);
  providerState("processed");
  await deliver(webhookBody(), "event_processed");
  await deliver(webhookBody(), "event_processed_again");
  await Promise.all([processRefundWebhook(), processRefundWebhook()]);
  assert.equal(ledger[0].status, "processed");
  assert.equal(balance.processedPaise, 2000);
  assert.equal(balance.reservedPaise, 0);
  assert.equal(balance.activeRefundId, undefined);
  assert.equal(booking.paymentStatus, "paid");
  assert.equal(ledger[0].audit.filter((entry) => entry.status === "processed").length, 1);
  assert.ok(inbox.every((event) => event.state === "applied"));
});

test("out-of-order created deliveries cannot downgrade a verified processed refund", async () => {
  await linkedRefund();
  providerState("processed");
  await deliver(webhookBody(), "event_processed");
  await processRefundWebhook();
  await deliver(webhookBody("refund.created"), "event_old_created");
  await processRefundWebhook();
  assert.equal(ledger[0].status, "processed");
  assert.equal(inbox[1].state, "applied");
  assert.equal(balance.processedPaise, 2000);
  assert.equal(ledger[0].audit.filter((entry) => entry.status === "processed").length, 1);
});

test("failed event keeps the hold while pending and releases it only after verified failure", async () => {
  await linkedRefund();
  providerState("pending");
  await deliver(webhookBody("refund.failed"));
  await processRefundWebhook();
  assert.equal(inbox[0].issue, "provider_state_pending");
  assert.equal(balance.reservedPaise, 2000);
  assert.equal(ledger[0].status, "approved");
  inbox[0].nextAttemptAt = new Date(0);
  providerState("failed");
  await processRefundWebhook();
  assert.equal(ledger[0].status, "failed");
  assert.equal(balance.reservedPaise, 0);
  assert.equal(balance.processedPaise, 0);
  assert.equal(inbox[0].state, "applied");
});

test("conflicting terminal evidence retains holds and cannot reverse a settled ledger", async () => {
  await linkedRefund();
  providerState("processed");
  await deliver(webhookBody("refund.failed"), "event_bad_failed");
  await processRefundWebhook();
  assert.equal(inbox[0].issue, "conflicting_terminal_state");
  assert.equal(balance.reservedPaise, 2000);
  await deliver(webhookBody(), "event_processed");
  await processRefundWebhook();
  providerState("failed");
  await deliver(webhookBody("refund.failed"), "event_failed_late");
  await processRefundWebhook();
  assert.equal(inbox[2].issue, "conflicting_terminal_state");
  assert.equal(ledger[0].status, "processed");
  assert.equal(balance.processedPaise, 2000);
});

test("provider lookup distinguishes unknown refunds, ambiguous states and verified external refunds", async () => {
  await deliver(webhookBody());
  await processRefundWebhook();
  assert.equal(inbox[0].issue, "unknown_refund_id");
  assert.equal(inbox[0].state, "retry");
  inbox[0].nextAttemptAt = new Date(0);
  readSingleRefund = async () => providerRefund({ status: "unexpected" });
  await processRefundWebhook();
  assert.equal(inbox[0].issue, "ambiguous_provider_status");
  readSingleRefund = async () => providerRefund({ status: "processed" });
  assert.equal(await processRefundWebhook(inbox[0]._id, admin), true);
  assert.equal(inbox[0].issue, "external_refund");
  assert.equal(inbox[0].verifiedStatus, "processed");
  assert.equal(ledger.length, 0);
  assert.equal(balance, undefined);
});

test("provider timeouts stop after bounded retries and a balance mismatch requires review", async () => {
  await linkedRefund();
  await deliver(webhookBody());
  readPayment = async () => { throw new DOMException("fixture timeout", "TimeoutError"); };
  for (let attempt = 1; attempt <= 5; attempt++) {
    await processRefundWebhook();
    assert.equal(inbox[0].issue, "unavailable");
    if (attempt < 5) inbox[0].nextAttemptAt = new Date(0);
  }
  assert.equal(inbox[0].state, "review");
  assert.equal(await processRefundWebhook(), false);
  assert.equal(balance.reservedPaise, 2000);
  readPayment = async () => ({ ...providerPayment });
  providerState("processed");
  balance.reservedPaise = 2001;
  await processRefundWebhook(inbox[0]._id, admin);
  assert.equal(inbox[0].issue, "ledger_mismatch");
  assert.equal(ledger[0].status, "approved");
});

test("a concurrent worker cannot claim a live lease, and an expired worker cannot settle after recovery", async () => {
  await linkedRefund();
  providerState("processed");
  await deliver(webhookBody());
  const entered = Promise.withResolvers();
  const release = Promise.withResolvers();
  let count = 0;
  readPayment = async () => {
    if (++count === 1) { entered.resolve(); await release.promise; }
    return { ...providerPayment };
  };
  const original = processRefundWebhook();
  await entered.promise;
  assert.equal(await processRefundWebhook(), false);
  inbox[0].leaseUntil = new Date(0);
  assert.equal(await processRefundWebhook(), true);
  release.resolve();
  await original;
  assert.equal(inbox[0].attemptCount, 2);
  assert.equal(inbox[0].state, "applied");
  assert.equal(balance.processedPaise, 2000);
  assert.equal(ledger[0].audit.filter((entry) => entry.status === "processed").length, 1);
});

test("an inbox write failure rolls back the refund, audit and ledger, then permits recovery", async () => {
  await linkedRefund();
  providerState("processed");
  await deliver(webhookBody());
  failInboxTransaction = true;
  await processRefundWebhook();
  assert.equal(ledger[0].status, "approved");
  assert.equal(ledger[0].audit.at(-1).status, "approved");
  assert.equal(balance.reservedPaise, 2000);
  assert.equal(balance.processedPaise, 0);
  assert.equal(inbox[0].issue, "reconciliation_failed");
  failInboxTransaction = false;
  inbox[0].nextAttemptAt = new Date(0);
  await processRefundWebhook();
  assert.equal(inbox[0].state, "applied");
  assert.equal(balance.processedPaise, 2000);
});

test("operator actions require a current admin and acknowledgment requires verified terminal evidence", async () => {
  await deliver(webhookBody());
  const get = () => operatorRoute.GET(withRequest("GET"));
  const post = (action) => operatorRoute.POST(withRequest("POST", { action, id: inbox[0]._id }));
  assert.equal((await get()).status, 403);
  assert.equal((await post("recheck")).status, 403);
  identity = null;
  assert.equal((await get()).status, 401);
  identity = { id: admin, role: "admin" };
  currentAdmin = other;
  assert.equal((await post("recheck")).status, 403);
  currentAdmin = admin;
  assert.equal((await post("mark_processed")).status, 400);
  assert.equal((await post("acknowledge")).status, 409);
  readSingleRefund = async () => providerRefund({ status: "processed" });
  assert.equal((await post("recheck")).status, 200);
  assert.equal((await post("acknowledge")).status, 200);
  assert.equal(inbox[0].acknowledgedBy, admin);
  assert.equal(ledger.length, 0);
  const response = await get();
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const [entry] = (await response.json()).items;
  assert.equal(entry.state, "acknowledged");
  for (const key of ["accountId", "bodyHash", "leaseToken", "payload"]) assert.equal(entry[key], undefined);
});

test("operator recheck preserves the ledger and resolution independently verifies the latest provider state", async () => {
  identity = { id: admin, role: "admin" };
  await linkedRefund();
  await deliver(webhookBody());
  const post = (action) => operatorRoute.POST(withRequest("POST", { action, id: inbox[0]._id }));
  assert.equal((await post("resolve")).status, 409);
  providerState("processed");
  assert.equal((await post("recheck")).status, 200);
  assert.equal(inbox[0].issue, "verified_reconciliation_available");
  assert.equal(ledger[0].status, "approved");
  assert.equal(balance.reservedPaise, 2000);
  providerState("failed");
  assert.equal((await post("resolve")).status, 200);
  assert.equal(inbox[0].issue, "conflicting_terminal_state");
  assert.equal(balance.reservedPaise, 2000);
  providerState("processed");
  await post("recheck");
  assert.equal((await post("resolve")).status, 200);
  assert.equal(inbox[0].state, "applied");
  assert.equal(ledger[0].status, "processed");
  assert.equal(balance.processedPaise, 2000);
});

async function preparedSubmission() {
  const { refund } = await create();
  await decideRefund(admin, refund._id, approve(2000));
  await prepareRefundExecution(admin, refund._id);
  return refund._id;
}

function submissionAction(id, action, extra) {
  return submissionRoute.POST(withRequest("POST", { action, ...extra }, identity?.id), {
    params: Promise.resolve({ id }),
  });
}

function attemptedProviderRefund(status = "processed", extra = {}) {
  const provider = providerRefund({ status, receipt: intents[0].receipt, ...extra });
  providerRefunds = [provider];
  providerPayment.amount_refunded = status === "processed" ? provider.amount : 0;
  readSingleRefund = async () => provider;
  return provider;
}

test("submission action is admin-only and execute is blocked even with the feature flag set", async () => {
  const { refund } = await create();
  assert.equal((await submissionAction(refund._id, "execute")).status, 403);
  identity = { id: admin, role: "admin" };
  currentAdmin = other;
  assert.equal((await submissionAction(refund._id, "prepare")).status, 403);
  currentAdmin = admin;
  assert.equal((await submissionAction(refund._id, "prepare")).status, 409);
  await decideRefund(admin, refund._id, approve(2000));
  assert.equal((await submissionAction(refund._id, "prepare", { amountPaise: 1 })).status, 400);
  assert.equal(typeof submissionRoute.GET, "undefined");
  await submissionAction(refund._id, "prepare");
  const original = process.env.RAZORPAY_REFUND_EXECUTION_ENABLED;
  try {
    delete process.env.RAZORPAY_REFUND_EXECUTION_ENABLED;
    assert.equal((await submissionAction(refund._id, "execute")).status, 503);
    process.env.RAZORPAY_REFUND_EXECUTION_ENABLED = "true";
    assert.equal((await submissionAction(refund._id, "execute")).status, 503);
  } finally {
    if (original === undefined) delete process.env.RAZORPAY_REFUND_EXECUTION_ENABLED;
    else process.env.RAZORPAY_REFUND_EXECUTION_ENABLED = original;
  }
  assert.equal(intents[0].state, "prepared");
  assert.equal(intents[0].attemptCount, 0);
  assert.equal(balance.reservedPaise, 2000);
});

test("concurrent dispatch claims persist once with the exact approved provider contract", async () => {
  const id = await preparedSubmission();
  const claims = await Promise.allSettled([claimRefundSubmission(admin, id), claimRefundSubmission(admin, id)]);
  assert.equal(claims.filter((item) => item.status === "fulfilled").length, 1);
  const request = claims.find((item) => item.status === "fulfilled").value;
  assert.deepEqual(request, {
    method: "POST", path: "/v1/payments/pay_fixture/refund",
    headers: { "X-Refund-Idempotency": id },
    body: { amount: 2000, speed: "normal", receipt: intents[0].receipt },
  });
  assert.match(intents[0].receipt, /^uas_[a-f0-9]{36}$/);
  assert.equal(intents[0].attemptCount, 1);
  assert.equal(intents[0].state, "dispatching");
  await assert.rejects(claimRefundSubmission(admin, id), { status: 409 });
});

test("dispatch refuses changed intent fields, wrong provider capture, and external refunds", async () => {
  const id = await preparedSubmission();
  for (const [key, invalid] of [["paymentId", "pay_wrong"], ["amountPaise", 1000]]) {
    const original = intents[0][key];
    intents[0][key] = invalid;
    await assert.rejects(claimRefundSubmission(admin, id), { status: 409 });
    intents[0][key] = original;
  }
  providerPayment.amount = 9999;
  await assert.rejects(claimRefundSubmission(admin, id), { status: 409 });
  providerPayment.amount = 10000;
  providerRefunds = [providerRefund()];
  await assert.rejects(claimRefundSubmission(admin, id), { status: 409 });
  assert.equal(intents[0].attemptCount, 0);
});

test("timeout or absent provider response leaves the reservation and requires evidence before linking", async () => {
  const id = await preparedSubmission();
  await claimRefundSubmission(admin, id);
  readPayment = async () => { throw new DOMException("fixture timeout", "TimeoutError"); };
  assert.deepEqual(await recoverRefundSubmission(admin, id), { status: "review", issue: "unavailable" });
  readPayment = async () => ({ ...providerPayment });
  assert.deepEqual(await recoverRefundSubmission(admin, id), { status: "review", issue: "provider_outcome_unproven" });
  assert.equal(balance.reservedPaise, 2000);
  assert.equal(intents[0].attemptCount, 1);
  attemptedProviderRefund();
  assert.deepEqual(await recoverRefundSubmission(admin, id), { status: "linked" });
  assert.equal(intents[0].providerStatus, "processed");
  assert.equal(ledger[0].razorpayRefundId, "rfnd_fixture");
  assert.equal(balance.reservedPaise, 2000);
  await deliver(webhookBody());
  await processRefundWebhook();
  assert.equal(balance.processedPaise, 2000);
});

test("webhook before response links and settles atomically, with no correlation from webhook receipt alone", async () => {
  const id = await preparedSubmission();
  await claimRefundSubmission(admin, id);
  const provider = attemptedProviderRefund();
  await deliver(webhookBody("refund.processed", { receipt: "untrusted_webhook_value" }));
  await processRefundWebhook();
  assert.equal(inbox[0].state, "applied");
  assert.equal(intents[0].providerRefundId, provider.id);
  assert.equal(ledger[0].status, "processed");
  assert.equal(balance.processedPaise, 2000);
  assert.deepEqual(await recoverRefundSubmission(admin, id), { status: "linked" });
});

test("a prepared intent is never correlated to a provider refund before a dispatch claim", async () => {
  await preparedSubmission();
  attemptedProviderRefund();
  await deliver(webhookBody());
  await processRefundWebhook();
  assert.equal(inbox[0].issue, "attempt_not_verifiable");
  assert.equal(intents[0].state, "prepared");
  assert.equal(ledger[0].razorpayRefundId, undefined);
  assert.equal(balance.reservedPaise, 2000);
});

test("provider receipt and provider ID conflicts cannot attach to the local intent", async () => {
  const id = await preparedSubmission();
  await claimRefundSubmission(admin, id);
  attemptedProviderRefund("processed", { amount: 1999 });
  assert.deepEqual(await recoverRefundSubmission(admin, id), { status: "review", issue: "provider_correlation_conflict" });
  attemptedProviderRefund();
  ledger.push({ ...ledger[0], _id: "fixture-other-refund", razorpayRefundId: "rfnd_fixture" });
  assert.deepEqual(await recoverRefundSubmission(admin, id), { status: "review", issue: "provider_link_conflict" });
  assert.equal(ledger[0].razorpayRefundId, undefined);
  assert.equal(balance.reservedPaise, 2000);
});

test("a failed persistence attempt rolls back and a fresh inbox worker can recover the same intent", async () => {
  const id = await preparedSubmission();
  await claimRefundSubmission(admin, id);
  attemptedProviderRefund();
  await deliver(webhookBody());
  failIntentWrite = true;
  await processRefundWebhook();
  assert.equal(inbox[0].state, "retry");
  assert.equal(intents[0].state, "dispatching");
  assert.equal(ledger[0].razorpayRefundId, undefined);
  assert.equal(balance.reservedPaise, 2000);
  failIntentWrite = false;
  inbox[0].nextAttemptAt = new Date(0);
  await processRefundWebhook();
  assert.equal(inbox[0].state, "applied");
  assert.equal(intents[0].state, "linked");
  assert.equal(intents[0].attemptCount, 1);
  assert.equal(balance.processedPaise, 2000);
});
