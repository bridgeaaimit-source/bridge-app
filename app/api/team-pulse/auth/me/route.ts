import { NextResponse } from "next/server";
import { getSession, COOKIE_NAME } from "@/lib/team-pulse/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: session,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === "logout" || request.method === "POST") {
      const response = NextResponse.json({ success: true, message: "Logged out successfully" });
      response.cookies.set({
        name: COOKIE_NAME,
        value: "",
        httpOnly: true,
        expires: new Date(0),
        path: "/",
      });
      return response;
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
