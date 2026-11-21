import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const schema = new Schema({
  _id: { type: String, required: true }, // One submission intent per refund.
  accountId: { type: String, required: true, immutable: true },
  paymentId: { type: String, required: true, immutable: true },
  amountPaise: { type: Number, required: true, immutable: true, min: 1, validate: Number.isSafeInteger },
  currency: { type: String, enum: ["INR"], required: true, immutable: true },
  operationKey: { type: String, required: true, immutable: true },
  idempotencyKey: { type: String, required: true, immutable: true },
  receipt: { type: String, required: true, immutable: true },
  state: { type: String, enum: ["prepared", "dispatching", "review", "linked"], required: true },
  preparedBy: { type: String, required: true },
  attemptCount: { type: Number, required: true, min: 0, max: 1, validate: Number.isSafeInteger },
  attemptedAt: Date,
  attemptedBy: String,
  providerRefundId: String,
  providerStatus: { type: String, enum: ["pending", "processed", "failed"] },
  checkedAt: Date,
  linkedAt: Date,
  issue: String,
}, { timestamps: true });

schema.index({ idempotencyKey: 1 }, { unique: true });
schema.index({ receipt: 1 }, { unique: true });
schema.index({ providerRefundId: 1 }, { unique: true, partialFilterExpression: { providerRefundId: { $type: "string" } } });

export type RefundSubmissionRecord = InferSchemaType<typeof schema>;
export default (mongoose.models.RefundSubmission as Model<RefundSubmissionRecord> | undefined)
  ?? mongoose.model<RefundSubmissionRecord>("RefundSubmission", schema);
