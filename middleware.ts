import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot",
  "/reset",
  "/verify",
];

const PUBLIC_API_ROUTES = [
  "/api/auth",
  "/api/contact",
  "/api/temples",
  "/api/services",
  "/api/routes",
];

const SECURITY_HEADERS = {
  "X-DNS-Prefetch-Control": "on",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-XSS-Protection": "1; mode=block",
};

function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth/")) {
    return addSecurityHeaders(NextResponse.next());
  }

  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
    return addSecurityHeaders(NextResponse.next());
  }

  if (pathname === "/api/auth") {
    return addSecurityHeaders(NextResponse.next());
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token && !pathname.startsWith("/api")) {
    const loginUrl = new URL("/login", req.url);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (!token && pathname.startsWith("/api")) {
    return addSecurityHeaders(
      NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    );
  }

  if (pathname.startsWith("/admin") && token?.role !== "admin") {
    if (pathname.startsWith("/api")) {
      return addSecurityHeaders(
        NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        )
      );
    }
    return addSecurityHeaders(NextResponse.redirect(new URL("/dashboard", req.url)));
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/booking/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/booking/:path*",
    "/api/admin/:path*",
    "/api/custom-booking/:path*",
    "/api/feedback/:path*",
  ],
};
