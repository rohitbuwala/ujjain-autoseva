import Razorpay from "razorpay";

type RazorpayClient = InstanceType<typeof Razorpay>;

export interface RazorpayCreateOrderInput {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderSummary {
  id: string;
  entity?: string;
  amount: number;
  amount_paid?: number;
  amount_due?: number;
  currency: string;
  receipt?: string;
  status?: string;
  attempts?: number;
  notes?: Record<string, string>;
  created_at?: number;
}

declare global {
  var __razorpayClient: RazorpayClient | undefined;
}

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured");
  }

  return { keyId, keySecret };
}

export function getRazorpayClient() {
  if (!globalThis.__razorpayClient) {
    const { keyId, keySecret } = getRazorpayCredentials();

    globalThis.__razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return globalThis.__razorpayClient;
}

export function toRazorpayMinorUnits(amount: number) {
  return Math.round(amount * 100);
}

export function normalizeCurrency(currency?: string) {
  return (currency || "INR").toUpperCase();
}

export function buildRazorpayReceipt(bookingId: string) {
  return `booking_${bookingId}`;
}

export async function createRazorpayOrder(input: RazorpayCreateOrderInput) {
  const client = getRazorpayClient();

  return client.orders.create({
    amount: toRazorpayMinorUnits(input.amount),
    currency: normalizeCurrency(input.currency),
    receipt: input.receipt,
    notes: input.notes,
    partial_payment: false,
  }) as Promise<RazorpayOrderSummary>;
}

export class RazorpayReadError extends Error {
  constructor(readonly category: "missing_order" | "ambiguous_order" | "provider_unavailable" | "provider_access") {
    super(category);
  }
}

async function readRazorpay<T>(path: string, signal: AbortSignal): Promise<T> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
    cache: "no-store",
    redirect: "error",
    signal,
  });
  if (!response.ok) {
    if (response.status === 404) throw new RazorpayReadError("missing_order");
    if (response.status === 401 || response.status === 403) throw new RazorpayReadError("provider_access");
    throw new RazorpayReadError("provider_unavailable");
  }
  return response.json() as Promise<T>;
}

export function fetchRazorpayPaymentForRefundReview(paymentId: string, signal: AbortSignal) {
  return readRazorpay<unknown>(`/payments/${encodeURIComponent(paymentId)}`, signal);
}

export function readRazorpayRefundPage(paymentId: string, skip: number, count: number, signal: AbortSignal) {
  const query = new URLSearchParams({ count: String(count), skip: String(skip) });
  return readRazorpay<unknown>(`/payments/${encodeURIComponent(paymentId)}/refunds?${query}`, signal);
}

export function fetchRazorpayRefundForReview(paymentId: string, refundId: string, signal: AbortSignal) {
  return readRazorpay<unknown>(`/payments/${encodeURIComponent(paymentId)}/refunds/${encodeURIComponent(refundId)}`, signal);
}

export async function fetchRazorpayOrder(orderId: string, signal?: AbortSignal) {
  if (signal) return readRazorpay<RazorpayOrderSummary>(`/orders/${encodeURIComponent(orderId)}`, signal);
  const client = getRazorpayClient();

  return client.orders.fetch(orderId) as Promise<RazorpayOrderSummary>;
}

export async function findRazorpayOrderByReceipt(receipt: string, signal?: AbortSignal) {
  const { items } = signal
    ? await readRazorpay<{ items: RazorpayOrderSummary[] }>(`/orders?${new URLSearchParams({ receipt, count: "2" })}`, signal)
    : await getRazorpayClient().orders.all({ receipt, count: 2 });
  if (items.length > 1 || items.some((order) => order.receipt !== receipt)) {
    throw new RazorpayReadError("ambiguous_order");
  }
  return (items[0] as RazorpayOrderSummary | undefined) ?? null;
}

export async function fetchRazorpayOrderPayments(orderId: string, signal?: AbortSignal) {
  const { items } = signal
    ? await readRazorpay<{ items: unknown[] }>(`/orders/${encodeURIComponent(orderId)}/payments`, signal)
    : await getRazorpayClient().orders.fetchPayments(orderId);
  return items;
}
