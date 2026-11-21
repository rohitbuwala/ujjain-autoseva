import { mongo } from "mongoose";

import connectDB from "@/lib/db";
import Notification from "@/models/Notification";
import { guardNotificationWrite } from "@/lib/notification-delivery-control";

type CreateNotificationInput = {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  bookingId?: string;
  eventKey: string;
};

const inboxFields = "_id type title message bookingId readAt createdAt updatedAt";

// The event key must identify one event for one recipient across retries.
export async function createNotification(input: CreateNotificationInput, options: { beforeWrite?: () => Promise<void> } = {}) {
  const notification = new Notification({ ...input, readAt: null });

  await connectDB();
  await guardNotificationWrite(options.beforeWrite);
  await Notification.init();

  await guardNotificationWrite(options.beforeWrite);
  try {
    return await notification.save();
  } catch (error) {
    if (
      !(error instanceof mongo.MongoServerError) ||
      error.code !== 11000 ||
      error.keyPattern?.eventKey !== 1
    ) {
      throw error;
    }

    // Keep the original content and read state. A key collision with a
    // different recipient or event must not return that notification.
    const existing = await Notification.findOne({
      eventKey: notification.eventKey,
      recipientId: notification.recipientId,
      type: notification.type,
      bookingId: notification.bookingId ?? null,
    });

    if (!existing) {
      throw error;
    }

    return existing;
  }
}

export async function listNotifications(recipientId: string, page: number, limit: number) {
  await connectDB();

  const filter = { recipientId };
  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .select(inboxFields)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getNotificationSummary(recipientId: string) {
  await connectDB();
  const [count, latest] = await Promise.all([
    Notification.countDocuments({ recipientId, readAt: null }),
    Notification.findOne({ recipientId }).sort({ createdAt: -1, _id: -1 }).select("_id").lean(),
  ]);

  return { count, latestId: latest?._id.toString() ?? null };
}

export async function markNotificationRead(recipientId: string, id: string) {
  await connectDB();

  const filter = { _id: id, recipientId };
  const updated = await Notification.findOneAndUpdate(
    { ...filter, readAt: null },
    { $set: { readAt: new Date() } },
    { returnDocument: "after" }
  )
    .select(inboxFields)
    .lean();

  return updated ?? Notification.findOne(filter).select(inboxFields).lean();
}
