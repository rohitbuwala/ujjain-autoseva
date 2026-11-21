import mongoose, { type InferSchemaType, type Model } from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    bookingId: { type: String, trim: true },
    eventKey: { type: String, required: true, trim: true, immutable: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, createdAt: -1, _id: -1 });
notificationSchema.index({ recipientId: 1, readAt: 1 });
notificationSchema.index({ eventKey: 1 }, { unique: true });

type NotificationRecord = InferSchemaType<typeof notificationSchema>;

export default (mongoose.models.Notification as Model<NotificationRecord> | undefined) ??
  mongoose.model<NotificationRecord>("Notification", notificationSchema);
