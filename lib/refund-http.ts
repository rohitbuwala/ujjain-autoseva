import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSession } from "@/lib/auth-utils";
import connectDB from "@/lib/db";
import { RefundError } from "@/lib/refunds";
import User from "@/models/User";

export function refundJson(data: object, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function refundPage(request: Request) {
  const value = new URL(request.url).searchParams.get("page") ?? "1";
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 1000) {
    throw new RefundError(400, "Invalid page.");
  }
  return Number(value);
}

export function refundErrorResponse(error: unknown) {
  if (error instanceof RefundError) return refundJson({ error: error.message }, error.status);
  console.error("Refund ledger operation failed");
  return refundJson({ error: "Unable to complete the refund operation." }, 500);
}

export async function requireRefundUser(request: Request) {
  const { session, response } = await requireSession();
  if (response) throw new RefundError(401, "Unauthorized.");
  const expected = request.headers.get("X-Refund-Account");
  if (expected !== null && expected !== session.user.id) throw new RefundError(401, "Session changed.");
  return session.user;
}

export async function requireRefundAdmin(request: Request) {
  const user = await requireRefundUser(request);
  const id = user.id;
  if (user.role !== "admin" || !mongoose.isObjectIdOrHexString(id)) {
    throw new RefundError(403, "Admin access required.");
  }
  await connectDB();
  if (!await User.exists({ _id: id, role: "admin" })) throw new RefundError(403, "Admin access required.");
  return id;
}
