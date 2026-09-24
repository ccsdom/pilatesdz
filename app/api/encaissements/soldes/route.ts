import { NextRequest, NextResponse } from "next/server";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { getOpenBalanceService } from "@/lib/packages/open-balances";
import { ManagementError } from "@/domain/ports/access-management";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager"]);
    const report = await getOpenBalanceService().list(actor, request.nextUrl.searchParams.get("after") ?? undefined);
    return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return error instanceof ManagementError ? NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } }) : authErrorResponse(error); }
}
