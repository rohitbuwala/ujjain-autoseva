import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot",
  "/reset",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes always allowed
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // API routes skip
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Static files skip
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Check login token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Not logged in → redirect
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in → allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/booking/:path*",
    "/dashboard/:path*",
    "/admin/:path*", 
  ],
};

