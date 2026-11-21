import { errorResponse } from "@/lib/api-utils";
import { requireSession } from "@/lib/auth-utils";

export function privateNotificationResponse<T extends Response>(response: T): T {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export function notificationError(message: string, status: number) {
  return privateNotificationResponse(errorResponse(message, status));
}

export async function requireNotificationSession(request: Request) {
  const result = await requireSession();
  if (result.response) return { session: null, response: privateNotificationResponse(result.response) };

  // A tab can still show the previous account when another tab changes the session cookie.
  const expectedUser = request.headers.get("X-Notification-Recipient");
  if (expectedUser !== null && expectedUser !== result.session.user.id) {
    return { session: null, response: notificationError("Session changed", 401) };
  }

  return result;
}
