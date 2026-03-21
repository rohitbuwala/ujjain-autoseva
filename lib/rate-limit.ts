import { NextResponse } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const rateLimitStore = new Map<string, { count: number; lastReset: number }>();

function cleanExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.lastReset > 60000) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanExpiredEntries, 60000);

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const key = `rate_limit:${identifier}`;

  let record = rateLimitStore.get(key);

  if (!record || now - record.lastReset >= config.windowMs) {
    record = { count: 0, lastReset: now };
    rateLimitStore.set(key, record);
  }

  record.count++;
  const remaining = Math.max(0, config.maxRequests - record.count);
  const reset = record.lastReset + config.windowMs;

  if (record.count > config.maxRequests) {
    return { success: false, remaining: 0, reset };
  }

  return { success: true, remaining, reset };
}

export function rateLimitResponse(reset: number) {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000);
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(reset),
      },
    }
  );
}

export function getRateLimitIdentifier(
  request: Request,
  fallbackIdentifier?: string
): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : fallbackIdentifier || "unknown";
  return ip;
}
