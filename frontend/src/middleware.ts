import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/gis-map",
  "/live",
  "/alerts",
  "/cameras",
  "/tracks",
  "/geofences",
  "/anpr",
  "/facial-recognition",
  "/settings",
  "/diagnostics",
];

const AUTH_COOKIE_NAME = "maatrix_session_token";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  let isValidSession = false;

  if (sessionCookie) {
    try {
      // Decode the session token payload (JSON encoded in base64)
      const decoded = atob(decodeURIComponent(sessionCookie));
      const parsed = JSON.parse(decoded);
      if (parsed && parsed.exp && Date.now() < parsed.exp) {
        isValidSession = true;
      }
    } catch {
      // Fallback for custom formatted tokens
      isValidSession = sessionCookie.startsWith("maatrix_");
    }
  }

  const isProtectedPath = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // 1. If accessing protected operator route without a valid session cookie
  if (isProtectedPath && !isValidSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    if (sessionCookie) {
      // If a cookie was present but expired
      loginUrl.searchParams.set("reason", "expired");
    }
    const response = NextResponse.redirect(loginUrl);
    if (sessionCookie && !isValidSession) {
      response.cookies.delete(AUTH_COOKIE_NAME);
    }
    return response;
  }

  // 2. If visiting /login while already possessing a valid active session
  if (pathname === "/login" && isValidSession) {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    const target =
      redirectParam && redirectParam.startsWith("/") && redirectParam !== "/login"
        ? redirectParam
        : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/gis-map/:path*",
    "/live/:path*",
    "/alerts/:path*",
    "/cameras/:path*",
    "/tracks/:path*",
    "/geofences/:path*",
    "/anpr/:path*",
    "/facial-recognition/:path*",
    "/settings/:path*",
    "/diagnostics/:path*",
    "/login",
  ],
};
