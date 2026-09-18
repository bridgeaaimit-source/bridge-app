import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect /team-pulse routes except login and static assets
  if (path.startsWith("/team-pulse")) {
    if (path === "/team-pulse/login" || path.startsWith("/team-pulse/team-pulse.css")) {
      return NextResponse.next();
    }

    const token = request.cookies.get("team_pulse_session")?.value;
    if (!token) {
      const loginUrl = new URL("/team-pulse/login", request.url);
      loginUrl.searchParams.set("from", path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /api/team-pulse routes except auth/login
  if (path.startsWith("/api/team-pulse") && !path.startsWith("/api/team-pulse/auth/login")) {
    const token = request.cookies.get("team_pulse_session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/team-pulse/:path*", "/api/team-pulse/:path*"],
};
