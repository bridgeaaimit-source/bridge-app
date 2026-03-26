import { NextResponse } from "next/server";

// Temporarily disabled for testing
/*
const protectedRoutes = ["/dashboard", "/interview", "/pulse", "/coach", "/gd", "/profile", "/smart-interview"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("bridge_auth")?.value;
  if (authCookie === "1") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/interview/:path*",
    "/pulse/:path*",
    "/coach/:path*",
    "/gd/:path*",
    "/profile/:path*",
    "/smart-interview/:path*",
  ],
};
*/

// Allow all routes during testing
export function middleware(request) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
