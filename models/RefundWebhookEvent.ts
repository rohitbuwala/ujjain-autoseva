import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const REFUND_WEBHOOK_TYPES = ["refund.created", "refund.processed", "refund.failed"] as const;
export const PROVIDER_REFUND_STATES = ["pending", "processed", "failed"] as const;
const inboxStates = ["queued", "retry", "review", "applied", "acknowledged"] as const;

const schema = new Schema({
  _id: { type: String, required: true },
  accountId: { type: String, required: true },
  eventId: { type: String, required: true },
  bodyHash: { type: String, required: true },
  eventType: { type: String, enum: REFUND_WEBHOOK_TYPES, required: true },
  refundId: { type: String, required: true },
  paymentId: { type: String, required: true },
  amountPaise: { type: Number, required: true },
  currency: { type: String, required: true },
  reportedStatus: { type: String, enum: PROVIDER_REFUND_STATES, required: true },
  providerCreatedAt: { type: Date, required: true },
  state: { type: String, enum: inboxStates, required: true },
  attemptCount: { type: Number, required: true },
  nextAttemptAt: Date,
  leaseToken: String,
  leaseUntil: Date,
  conflictAt: Date,
  issue: String,
  verifiedStatus: { type: String, enum: PROVIDER_REFUND_STATES },
  checkedAt: Date,
  acknowledgedAt: Date,
  acknowledgedBy: String,
  lastRecheckedBy: String,
}, { timestamps: true });

schema.index({ accountId: 1, eventId: 1 }, { unique: true });
schema.index({ state: 1, nextAttemptAt: 1, _id: 1 });
schema.index({ createdAt: -1, _id: -1 });

export type RefundWebhookRecord = InferSchemaType<typeof schema>;
export default (mongoose.models.RefundWebhookEvent as Model<RefundWebhookRecord> | undefined)
  ?? mongoose.model<RefundWebhookRecord>("RefundWebhookEvent", schema);
