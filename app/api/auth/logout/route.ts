import { NextRequest, NextResponse } from "next/server";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { isTrustedMutation } from "@/lib/auth/request-policy";
import { authErrorResponse } from "@/lib/auth/http";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request.headers.get("origin"), request.headers.get("content-type"), process.env.APP_ORIGIN)) {
    return NextResponse.json({ error: "Requête non autorisée." }, { status: 403 });
  }
  try {
    const cookie = request.cookies.get(SESSION_COOKIE)?.value;
    if (cookie) await getAuthService().logout(cookie);
    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/",
      secure: process.env.NODE_ENV === "production", maxAge: 0 });
    return response;
  } catch (error) { return authErrorResponse(error); }
}
