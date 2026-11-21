import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const REFUND_STATUSES = ["requested", "under_review", "approved", "processing", "processed", "rejected", "failed", "needs_review"] as const;
const auditSchema = new Schema({
  status: { type: String, enum: REFUND_STATUSES, required: true },
  actorId: { type: String, required: true },
  at: { type: Date, required: true },
  note: String,
}, { _id: false });

const refundSchema = new Schema({
  _id: { type: String, required: true },
  bookingId: { type: Schema.Types.ObjectId, required: true },
  bookingCode: { type: String, required: true },
  customerId: { type: String, required: true },
  razorpayPaymentId: { type: String, required: true },
  capturedPaise: { type: Number, required: true },
  currency: { type: String, required: true },
  requestedPaise: Number,
  approvedPaise: Number,
  type: { type: String, enum: ["full", "partial"] },
  reason: { type: String, required: true },
  status: { type: String, enum: REFUND_STATUSES, required: true },
  operationKey: { type: String, required: true, immutable: true },
  razorpayRefundId: { type: String, default: null },
  requestedAt: { type: Date, required: true },
  approvedAt: Date,
  rejectedAt: Date,
  processingAt: Date,
  processedAt: Date,
  adminId: String,
  adminReason: String,
  audit: { type: [auditSchema], default: [] },
  failureReason: String,
  retryCount: { type: Number, default: 0 },
  nextRetryAt: Date,
  reconciledAt: Date,
  executionPreparedAt: Date,
  executionPreparedBy: String,
  executionIdempotencyKey: String,
}, { timestamps: true });

refundSchema.index({ operationKey: 1 }, { unique: true });
refundSchema.index({ razorpayRefundId: 1 }, { unique: true, partialFilterExpression: { razorpayRefundId: { $type: "string" } } });
refundSchema.index({ customerId: 1, requestedAt: -1, _id: -1 });
refundSchema.index({ requestedAt: -1, _id: -1 });
refundSchema.index({ status: 1, requestedAt: -1, _id: -1 });
refundSchema.index({ bookingId: 1, requestedAt: -1 });
refundSchema.index({ razorpayPaymentId: 1 });

const balanceSchema = new Schema({
  _id: { type: String, required: true }, // Razorpay payment ID
  bookingId: { type: Schema.Types.ObjectId, required: true },
  customerId: { type: String, required: true },
  capturedPaise: { type: Number, required: true },
  currency: { type: String, required: true },
  reservedPaise: { type: Number, required: true },
  processedPaise: { type: Number, required: true },
  activeRefundId: String,
  providerCheckVersion: Number,
  providerCheckStatus: { type: String, enum: ["checking", "verified", "needs_review", "consumed"] },
  providerCheckedAt: Date,
  providerIssue: String,
  providerProcessedPaise: Number,
  providerPendingPaise: Number,
  providerAvailablePaise: Number,
  externalRefundCount: Number,
}, { timestamps: true });

export type RefundRecord = InferSchemaType<typeof refundSchema>;
type BalanceRecord = InferSchemaType<typeof balanceSchema>;
const Refund = (mongoose.models.Refund as Model<RefundRecord> | undefined) ?? mongoose.model<RefundRecord>("Refund", refundSchema);
export const RefundBalance = (mongoose.models.RefundBalance as Model<BalanceRecord> | undefined) ?? mongoose.model<BalanceRecord>("RefundBalance", balanceSchema);
export default Refund;
