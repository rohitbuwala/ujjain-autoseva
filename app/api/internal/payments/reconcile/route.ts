import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function authorized(header: string | null, secret: string | undefined) {
  if (!header || header.length > 512 || !secret || secret.length < 32) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}

export async function GET(request: Request) {
  if (process.env.PAYMENT_RECONCILIATION_ENABLED !== "true") return json({ error: "Not found" }, 404);
  if (!authorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const deadline = Date.now() + 18_000;
  try {
    const [{ default: connectDB }, { runPaymentReconciliation }] = await Promise.all([
      import("@/lib/db"), import("@/lib/payment-reconciliation"),
    ]);
    await connectDB();
    return json({ success: true, ...(await runPaymentReconciliation(deadline)) });
  } catch {
    console.error("Payment reconciliation batch failed");
    return json({ error: "Reconciliation could not finish" }, 500);
  }
}
