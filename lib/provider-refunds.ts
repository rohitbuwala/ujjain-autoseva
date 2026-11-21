import { z } from "zod";
import { RAZORPAY_ORDER_ID, RAZORPAY_PAYMENT_ID } from "@/lib/booking-payments";
import { fetchRazorpayPaymentForRefundReview, readRazorpayRefundPage } from "@/lib/razorpay";

const LOOKUP_TIMEOUT_MS = 8_000;
const PAGE_SIZE = 50;
const MAX_PAGES = 10;
const refundId = /^rfnd_[A-Za-z0-9]{1,64}$/;
const ledgerPaise = z.number().int().nonnegative();
const paymentSchema = z.object({
  id: z.string().regex(RAZORPAY_PAYMENT_ID),
  order_id: z.string().regex(RAZORPAY_ORDER_ID),
  captured: z.literal(true),
  status: z.enum(["captured", "refunded"]),
  currency: z.literal("INR"),
  amount: ledgerPaise.positive(),
  amount_refunded: ledgerPaise,
});
export const providerRefundSchema = z.object({
  id: z.string().regex(refundId),
  payment_id: z.string().regex(RAZORPAY_PAYMENT_ID),
  currency: z.literal("INR"),
  amount: ledgerPaise.positive(),
  status: z.enum(["pending", "processed", "failed"]),
  receipt: z.string().max(255).nullish(),
});
const pageSchema = z.object({ entity: z.literal("collection"), count: ledgerPaise, items: z.array(providerRefundSchema).max(PAGE_SIZE) });

export type RefundCaptureIdentity = { paymentId: string; orderId: string; capturedPaise: number; currency: string };
export type ProviderRefund = z.infer<typeof providerRefundSchema>;
type Snapshot = { refunds: ProviderRefund[]; processedPaise: number; pendingPaise: number; availablePaise: number };
type LocalRefund = { status: string; razorpayRefundId?: string | null; approvedPaise?: number | null; currency: string };

export class RefundProviderError extends Error {
  constructor(readonly category: "unavailable" | "capture_mismatch" | "incomplete_history" | "invalid_refunds") {
    super(category);
  }
}

export async function readProviderRefunds(identity: RefundCaptureIdentity): Promise<Snapshot> {
  if (!RAZORPAY_PAYMENT_ID.test(identity.paymentId) || !RAZORPAY_ORDER_ID.test(identity.orderId) ||
      identity.currency !== "INR" || !Number.isSafeInteger(identity.capturedPaise) || identity.capturedPaise <= 0) {
    throw new RefundProviderError("capture_mismatch");
  }
  const signal = AbortSignal.timeout(LOOKUP_TIMEOUT_MS);
  async function readPayment() {
    const parsed = paymentSchema.safeParse(await fetchRazorpayPaymentForRefundReview(identity.paymentId, signal));
    if (!parsed.success || parsed.data.id !== identity.paymentId || parsed.data.order_id !== identity.orderId ||
        parsed.data.amount !== identity.capturedPaise || parsed.data.currency !== identity.currency ||
        parsed.data.amount_refunded > identity.capturedPaise) {
      throw new RefundProviderError("capture_mismatch");
    }
    return parsed.data;
  }

  async function readPage(skip: number) {
    const result = pageSchema.safeParse(await readRazorpayRefundPage(identity.paymentId, skip, PAGE_SIZE, signal));
    if (!result.success || result.data.count !== result.data.items.length) throw new RefundProviderError("invalid_refunds");
    return result.data.items;
  }

  try {
    const before = await readPayment();
    const firstPage = await readPage(0);
    const refunds = new Map<string, ProviderRefund>();
    let processedPaise = 0;
    let pendingPaise = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const items = page === 0 ? firstPage : await readPage(page * PAGE_SIZE);
      for (const item of items) {
        if (item.payment_id !== identity.paymentId || item.currency !== identity.currency ||
            item.amount > identity.capturedPaise || refunds.has(item.id)) throw new RefundProviderError("invalid_refunds");
        refunds.set(item.id, item);
        if (item.status === "processed") processedPaise += item.amount;
        if (item.status === "pending") pendingPaise += item.amount;
        if (processedPaise + pendingPaise > identity.capturedPaise) throw new RefundProviderError("invalid_refunds");
      }
      if (items.length < PAGE_SIZE) {
        const after = await readPayment();
        const latestFirstPage = await readPage(0);
        if (before.amount_refunded !== after.amount_refunded || before.status !== after.status ||
            JSON.stringify(firstPage) !== JSON.stringify(latestFirstPage) ||
            after.amount_refunded < processedPaise || after.amount_refunded > processedPaise + pendingPaise ||
            (after.status === "refunded" && processedPaise + pendingPaise !== identity.capturedPaise)) {
          throw new RefundProviderError("incomplete_history");
        }
        return { refunds: [...refunds.values()], processedPaise, pendingPaise,
          availablePaise: identity.capturedPaise - processedPaise - pendingPaise };
      }
    }
    throw new RefundProviderError("incomplete_history");
  } catch (error) {
    if (error instanceof RefundProviderError) throw error;
    throw new RefundProviderError("unavailable");
  }
}

export function compareRefundLedger(
  snapshot: Snapshot,
  rows: LocalRefund[],
  balance: { reservedPaise: number; processedPaise: number }
) {
  const localByProviderId = new Map<string, LocalRefund>();
  let reserved = 0;
  let processed = 0;
  let pendingMatched = 0;
  let mismatch = false;
  for (const row of rows) {
    const amount = row.approvedPaise;
    const held = row.status === "approved" || row.status === "processing" || row.status === "needs_review";
    if (held || row.status === "processed" || row.razorpayRefundId) {
      if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount <= 0 || row.currency !== "INR") {
        mismatch = true;
        continue;
      }
      if (held) reserved += amount;
      if (row.status === "processed") processed += amount;
    }
    if (row.razorpayRefundId && (localByProviderId.has(row.razorpayRefundId) || !refundId.test(row.razorpayRefundId))) {
      mismatch = true;
    }
    if (row.razorpayRefundId) localByProviderId.set(row.razorpayRefundId, row);
    else if (row.status === "processing" || row.status === "processed" || row.status === "needs_review") mismatch = true;
  }

  let externalRefundCount = 0;
  for (const refund of snapshot.refunds) {
    const row = localByProviderId.get(refund.id);
    if (!row) {
      externalRefundCount++;
      continue;
    }
    localByProviderId.delete(refund.id);
    const expected = refund.status === "pending"
      ? row.status === "processing" || row.status === "needs_review"
      : row.status === refund.status;
    if (!expected || row.approvedPaise !== refund.amount || row.currency !== refund.currency) mismatch = true;
    if (refund.status === "pending") pendingMatched += refund.amount;
  }
  if (localByProviderId.size || reserved !== balance.reservedPaise || processed !== balance.processedPaise ||
      processed !== snapshot.processedPaise || pendingMatched !== snapshot.pendingPaise) mismatch = true;

  const availablePaise = snapshot.availablePaise - (reserved - pendingMatched);
  return {
    externalRefundCount,
    issue: externalRefundCount ? "external_refunds" :
      mismatch || !Number.isSafeInteger(availablePaise) || availablePaise < 0 ? "ledger_mismatch" : null,
    availablePaise,
  };
}
