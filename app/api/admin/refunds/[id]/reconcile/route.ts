import { refundErrorResponse, refundJson, requireRefundAdmin } from "@/lib/refund-http";
import { reconcileRefundBalance, REFUND_ID } from "@/lib/refunds";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRefundAdmin(request);
    const { id } = await params;
    if (!REFUND_ID.test(id)) return refundJson({ error: "Invalid refund ID." }, 400);
    const result = await reconcileRefundBalance(id);
    return refundJson({ status: result.status, issue: result.issue, availablePaise: result.availablePaise,
      processedPaise: result.processedPaise, pendingPaise: result.pendingPaise, externalRefundCount: result.externalRefundCount });
  } catch (error) {
    return refundErrorResponse(error);
  }
}
