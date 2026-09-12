import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { isTrustedMutation, readLimitedBody } from "@/lib/auth/request-policy";
import { authErrorResponse } from "@/lib/auth/http";
import { SESSION_DURATION_MS } from "@/services/auth-service";

export const runtime = "nodejs";
const input = z.object({ idToken: z.string().min(1).max(10000) }).strict();

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request.headers.get("origin"), request.headers.get("content-type"), process.env.APP_ORIGIN)) {
    return NextResponse.json({ error: "Requête non autorisée." }, { status: 403 });
  }
  // A bounded body prevents oversized input from reaching token verification.
  let raw;
  try { raw = await readLimitedBody(request); }
  catch { return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 }); }
  let parsed;
  try { parsed = input.safeParse(JSON.parse(raw)); }
  catch { return NextResponse.json({ error: "Requête invalide." }, { status: 400 }); }
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  try {
    const { cookie, access } = await getAuthService().login(parsed.data.idToken);
    const response = NextResponse.json({ destination: access.role === "admin" ? "/crm" : "/espace-cliente" },
      { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(SESSION_COOKIE, cookie, { httpOnly: true, sameSite: "strict", path: "/",
      secure: process.env.NODE_ENV === "production", maxAge: SESSION_DURATION_MS / 1000 });
    return response;
  } catch (error) { return authErrorResponse(error); }
}
