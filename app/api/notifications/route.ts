import { successResponse } from "@/lib/api-utils";
import { listNotifications } from "@/lib/notifications";
import { notificationError, privateNotificationResponse, requireNotificationSession } from "./session";

export async function GET(request: Request) {
  try {
    const { session, response } = await requireNotificationSession(request);
    if (response) return response;

    const params = new URL(request.url).searchParams;
    const pageParam = params.get("page") ?? "1";
    const limitParam = params.get("limit") ?? "20";

    if (!/^\d+$/.test(pageParam) || !/^\d+$/.test(limitParam)) {
      return notificationError("Page and limit must be positive integers", 400);
    }

    const page = Number(pageParam);
    const limit = Number(limitParam);
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      limit < 1 ||
      limit > 100 ||
      !Number.isSafeInteger((page - 1) * limit)
    ) {
      return notificationError("Page must be positive and limit must be between 1 and 100", 400);
    }

    return privateNotificationResponse(successResponse(await listNotifications(session.user.id, page, limit)));
  } catch {
    console.error("Failed to list notifications");
    return notificationError("Server Error", 500);
  }
}
