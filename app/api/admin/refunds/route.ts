import { refundErrorResponse, refundJson, refundPage, requireRefundAdmin } from "@/lib/refund-http";
import { listRefunds } from "@/lib/refunds";

export async function GET(request: Request) {
  try {
    await requireRefundAdmin(request);
    const pendingOnly = new URL(request.url).searchParams.get("scope") !== "all";
    return refundJson(await listRefunds(refundPage(request), undefined, pendingOnly));
  } catch (error) {
    return refundErrorResponse(error);
  }
}
