import { randomBytes } from "node:crypto";
import { RAZORPAY_PAYMENT_ID } from "@/lib/booking-payments";
import type { RefundSubmissionRecord } from "@/models/RefundSubmission";

export const RAZORPAY_ACCOUNT_ID = /^acc_[A-Za-z0-9]{1,64}$/;
export const REFUND_RECEIPT = /^uas_[a-f0-9]{36}$/;

export function newRefundReceipt() {
  return `uas_${randomBytes(18).toString("hex")}`;
}

// This phase intentionally ships without a refund POST transport.
const refundTransportInstalled = false;
export function refundExecutionEnabled() {
  return process.env.RAZORPAY_REFUND_EXECUTION_ENABLED === "true" && refundTransportInstalled;
}

export function buildRefundSubmissionRequest(intent: RefundSubmissionRecord) {
  if (!RAZORPAY_PAYMENT_ID.test(intent.paymentId) || intent.currency !== "INR" ||
      !Number.isSafeInteger(intent.amountPaise) || intent.amountPaise < 1 ||
      !/^[a-f0-9]{64}$/.test(intent.idempotencyKey) || intent.idempotencyKey !== intent.operationKey ||
      intent._id !== intent.operationKey || !REFUND_RECEIPT.test(intent.receipt) || !RAZORPAY_ACCOUNT_ID.test(intent.accountId)) {
    throw new Error("Invalid Razorpay refund submission contract");
  }
  return {
    method: "POST" as const,
    path: `/v1/payments/${intent.paymentId}/refund`,
    headers: { "X-Refund-Idempotency": intent.idempotencyKey },
    body: { amount: intent.amountPaise, speed: "normal" as const, receipt: intent.receipt },
  };
}
