import { refundErrorResponse, refundJson, requireRefundAdmin } from "@/lib/refund-http";
import { customerRefund, decideRefund, REFUND_ID, refundDecisionSchema } from "@/lib/refunds";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminId = await requireRefundAdmin(request);
    const { id } = await params;
    const parsed = refundDecisionSchema.safeParse(await request.json().catch(() => null));
    if (!REFUND_ID.test(id) || !parsed.success) return refundJson({ error: "Invalid refund decision." }, 400);
    return refundJson(customerRefund(await decideRefund(adminId, id, parsed.data)));
  } catch (error) {
    return refundErrorResponse(error);
  }
}
