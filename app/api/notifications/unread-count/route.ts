import { successResponse } from "@/lib/api-utils";
import { getNotificationSummary } from "@/lib/notifications";
import { notificationError, privateNotificationResponse, requireNotificationSession } from "../session";

export async function GET(request: Request) {
  try {
    const { session, response } = await requireNotificationSession(request);
    if (response) return response;

    return privateNotificationResponse(successResponse(await getNotificationSummary(session.user.id)));
  } catch {
    console.error("Failed to count unread notifications");
    return notificationError("Server Error", 500);
  }
}
