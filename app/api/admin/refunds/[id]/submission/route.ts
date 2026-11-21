import { z } from "zod";
import { refundErrorResponse, refundJson, requireRefundAdmin } from "@/lib/refund-http";
import { refundExecutionEnabled } from "@/lib/razorpay-refund-submission";
import { prepareRefundExecution, recoverRefundSubmission } from "@/lib/refund-submission";
import { REFUND_ID } from "@/lib/refunds";

const input = z.strictObject({ action: z.enum(["prepare", "recover", "execute"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRefundAdmin(request);
    if (request.headers.get("X-Refund-Account") !== admin) return refundJson({ error: "Missing refund account context." }, 403);
    const { id } = await params;
    const parsed = input.safeParse(await request.json().catch(() => null));
    if (!REFUND_ID.test(id) || !parsed.success) return refundJson({ error: "Invalid refund submission action." }, 400);
    if (parsed.data.action === "execute") {
      const error = refundExecutionEnabled() ? "Refund execution transport unavailable." : "Refund execution is disabled.";
      return refundJson({ error }, 503);
    }
    return refundJson(parsed.data.action === "prepare"
      ? await prepareRefundExecution(admin, id) : await recoverRefundSubmission(admin, id));
  } catch (error) {
    return refundErrorResponse(error);
  }
}
