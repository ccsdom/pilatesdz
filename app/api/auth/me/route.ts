import { NextRequest, NextResponse } from "next/server";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { AccessError } from "@/domain/models/access";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE)?.value;
    if (!cookie) throw new AccessError(401);
    const access = await getAuthService().authorize(cookie, ["client", "admin"]);
    return NextResponse.json(access, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return authErrorResponse(error); }
}
