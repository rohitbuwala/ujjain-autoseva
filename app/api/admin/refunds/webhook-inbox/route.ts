import { refundErrorResponse, refundJson, refundPage, requireRefundAdmin } from "@/lib/refund-http";
import {
  acknowledgeExternalRefund, listRefundWebhookEvents, processRefundWebhook, refundWebhookOperatorAction,
} from "@/lib/refund-webhook-inbox";

export async function GET(request: Request) {
  try {
    await requireRefundAdmin(request);
    return refundJson(await listRefundWebhookEvents(refundPage(request)));
  } catch (error) {
    return refundErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await requireRefundAdmin(request);
    const parsed = refundWebhookOperatorAction.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return refundJson({ error: "Invalid refund inbox action." }, 400);
    const action = parsed.data;
    if (action.action === "acknowledge") {
      await acknowledgeExternalRefund(action.id, adminId);
      return refundJson({ acknowledged: true });
    }
    const checked = action.action === "process_next"
      ? await processRefundWebhook(undefined, adminId)
      : await processRefundWebhook(action.id, adminId, action.action);
    if (action.action !== "process_next" && !checked) return refundJson({ error: "Event is not available for this action." }, 409);
    return refundJson({ checked });
  } catch (error) {
    return refundErrorResponse(error);
  }
}
