import { NextRequest, NextResponse } from "next/server";

const PUBLIC_BYPASS = [
  "/password",
  "/api/",
  "/_next/",
  "/favicon.ico",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow admin routes, the password page, API routes, and Next.js internals
  if (
    pathname.startsWith("/admin") ||
    PUBLIC_BYPASS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // Also allow static files (images, fonts, etc.)
  if (/\.(.+)$/.test(pathname)) {
    return NextResponse.next();
  }

  const password = process.env.PORTFOLIO_PASSWORD;

  // If no password is configured, allow everything through
  if (!password) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("portfolio_auth")?.value;

  if (authCookie === password) {
    return NextResponse.next();
  }

  // Redirect to password page, preserving the intended destination
  const loginUrl = new URL("/password", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
