import { isObjectIdOrHexString } from "mongoose";

import { successResponse } from "@/lib/api-utils";
import { markNotificationRead } from "@/lib/notifications";
import { notificationError, privateNotificationResponse, requireNotificationSession } from "../../session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await requireNotificationSession(request);
    if (response) return response;

    const { id } = await params;
    if (!isObjectIdOrHexString(id)) {
      return notificationError("Invalid notification ID", 400);
    }

    const notification = await markNotificationRead(session.user.id, id);
    if (!notification) return notificationError("Notification not found", 404);

    return privateNotificationResponse(successResponse(notification));
  } catch {
    console.error("Failed to mark notification as read");
    return notificationError("Server Error", 500);
  }
}
