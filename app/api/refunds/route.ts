import connectDB from "@/lib/db";
import { customerRefund, listRefunds, refundRequestSchema, requestRefund } from "@/lib/refunds";
import { refundErrorResponse, refundJson, refundPage, requireRefundUser } from "@/lib/refund-http";

export async function GET(request: Request) {
  try {
    const user = await requireRefundUser(request);
    await connectDB();
    return refundJson(await listRefunds(refundPage(request), user.id));
  } catch (error) {
    return refundErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRefundUser(request);
    const parsed = refundRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return refundJson({ error: "Invalid refund request." }, 400);
    await connectDB();
    const result = await requestRefund(user.id, parsed.data);
    return refundJson(customerRefund(result.refund), result.created ? 201 : 200);
  } catch (error) {
    return refundErrorResponse(error);
  }
}
