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
  }) as Promise<RazorpayOrderSummary>;
}

export async function fetchRazorpayOrder(orderId: string) {
  const client = getRazorpayClient();

  return client.orders.fetch(orderId) as Promise<RazorpayOrderSummary>;
}