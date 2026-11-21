import { randomUUID } from "node:crypto";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { createNotification } from "@/lib/notifications";
import { guardNotificationWrite, NotificationGuardError } from "@/lib/notification-delivery-control";

export const BOOKING_EVENTS = ["created", "confirmed", "rejected", "admin_cancelled", "customer_cancelled"] as const;
export type BookingEvent = typeof BOOKING_EVENTS[number];
export type Delivery = {
  eventKey: string; recipientId: string; audience: "customer" | "admin";
  type: string; title: string; message: string; bookingId: string;
  state: "pending" | "delivered" | "skipped" | "review";
  attempts: number; nextAt: Date; leaseToken?: string; leaseUntil?: Date;
};
const titles: Record<BookingEvent, string> = {
  created: "Booking request received", confirmed: "Booking confirmed",
  rejected: "Booking rejected", admin_cancelled: "Booking cancelled",
  customer_cancelled: "Customer cancelled booking",
};

// Resolve admins before persistence; never accept recipient lists from a request.
export async function bookingEvent(booking: { _id: unknown; bookingId: string; userId: string }, event: BookingEvent): Promise<Delivery[]> {
  const admins = event === "created" || event === "customer_cancelled"
    ? await User.find({ role: "admin" }).select("_id").lean() : [];
  const recipients = new Map<string, "customer" | "admin">();
  for (const admin of admins) recipients.set(String(admin._id), "admin");
  if (event !== "customer_cancelled") recipients.set(booking.userId, "customer");
  return [...recipients].map(([recipientId, audience]) => ({
    eventKey: `booking:${String(booking._id)}:${event}:recipient:${recipientId}`,
    recipientId, audience, type: `booking_${event}`, title: titles[event],
    message: `${booking.bookingId}: ${titles[event]}.${event === "confirmed" ? " Please review your payment options." : ""}`,
    bookingId: booking.bookingId, state: "pending", attempts: 0, nextAt: new Date(),
  }));
}

// Append a separate pipeline stage: existing cancellation/payment expressions remain untouched.
export function appendBookingEvent<T>(pipeline: T[], events: Delivery[]) {
  return [...pipeline, { $set: { notificationOutbox: {
    $concatArrays: [{ $ifNull: ["$notificationOutbox", []] }, { $literal: events }],
  } } }];
}

export function publicBooking<T extends Record<string, unknown>>(booking: T) {
  const copy = { ...booking };
  delete copy.notificationOutbox;
  return copy;
}

// Explicit caller only. No timers, route hooks, cron, or post-response promises.
export type BookingDrainOptions = {
  beforeWrite?: () => Promise<void>;
  signal?: AbortSignal;
  createdSince?: Date;
  onDeliveryError?: () => void;
};

export async function drainBookingOutbox(limit = 20, options: BookingDrainOptions = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("Invalid drain limit");
  if (options.createdSince && !Number.isFinite(+options.createdSince)) throw new Error("Invalid activation cutoff");
  const scope = { bookingId: { $ne: "UA-0E0723" },
    ...(options.createdSince ? { createdAt: { $gte: options.createdSince } } : {}) };
  const summary = { delivered: 0, skipped: 0, retry: 0, review: 0, stale: 0 };
  for (let count = 0; count < limit; count++) {
    if (options.signal?.aborted) break;
    const now = new Date();
    // Crash recovery is bounded by the same batch limit; never re-dispatch a fifth attempt.
    await guardNotificationWrite(options.beforeWrite);
    if (options.signal?.aborted) break;
    const exhausted = await Booking.findOneAndUpdate({ ...scope, notificationOutbox: { $elemMatch: {
      state: "pending", attempts: { $gte: 5 }, leaseUntil: { $lte: now },
    } } }, { $set: { "notificationOutbox.$.state": "review" } }, { returnDocument: "after" })
      .select("_id").lean();
    if (exhausted) { summary.review++; continue; }
    const due = { state: "pending", nextAt: { $lte: now }, attempts: { $lt: 5 },
      $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lte: now } }] };
    const token = randomUUID();
    await guardNotificationWrite(options.beforeWrite);
    if (options.signal?.aborted) break;
    const row = await Booking.findOneAndUpdate(
      { ...scope, notificationOutbox: { $elemMatch: due } },
      { $set: { "notificationOutbox.$.leaseToken": token, "notificationOutbox.$.leaseUntil": new Date(Date.now() + 45_000) },
        $inc: { "notificationOutbox.$.attempts": 1 } },
      { returnDocument: "after" }
    ).select("+notificationOutbox userId").lean();
    if (!row) break;
    const entry = (row.notificationOutbox as Delivery[]).find(item => item.leaseToken === token)!;
    let outcome: "delivered" | "skipped" | "retry" | "review" = "delivered";
    try {
      const eligible = entry.audience === "admin"
        ? await User.exists({ _id: entry.recipientId, role: "admin" })
        : entry.recipientId === row.userId && await User.exists({ _id: entry.recipientId });
      if (!eligible) outcome = "skipped";
      else await createNotification({ recipientId: entry.recipientId, type: entry.type,
        title: entry.title, message: entry.message, bookingId: entry.bookingId, eventKey: entry.eventKey },
      { beforeWrite: options.beforeWrite });
    } catch (error) {
      if (error instanceof NotificationGuardError) throw error;
      options.onDeliveryError?.();
      outcome = entry.attempts >= 5 ? "review" : "retry";
    }
    // Check the same entry against server time in the atomic acknowledgment operation.
    // $expr belongs at the query root; $$NOW must not be a pre-delivery client timestamp.
    await guardNotificationWrite(options.beforeWrite);
    const saved = await Booking.updateOne({
      ...scope,
      _id: row._id,
      notificationOutbox: { $elemMatch: { eventKey: entry.eventKey, state: "pending", leaseToken: token } },
      $expr: { $anyElementTrue: [{ $map: {
        input: { $ifNull: ["$notificationOutbox", []] }, as: "delivery",
        in: { $and: [
          { $eq: ["$$delivery.eventKey", { $literal: entry.eventKey }] },
          { $eq: ["$$delivery.state", "pending"] },
          { $eq: ["$$delivery.leaseToken", { $literal: token }] },
          { $eq: [{ $type: "$$delivery.leaseUntil" }, "date"] },
          { $gt: ["$$delivery.leaseUntil", "$$NOW"] },
        ] },
      } }] },
    }, {
      $set: { "notificationOutbox.$.state": outcome === "retry" ? "pending" : outcome,
        "notificationOutbox.$.nextAt": new Date(Date.now() + Math.min(300_000, 5000 * 2 ** (entry.attempts - 1))) },
      $unset: { "notificationOutbox.$.leaseToken": 1, "notificationOutbox.$.leaseUntil": 1 },
    });
    summary[saved.matchedCount ? outcome : "stale"]++;
  }
  return summary;
}
