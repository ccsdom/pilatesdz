import { NextRequest, NextResponse } from "next/server";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { getClientHistoryService } from "@/lib/client-history/server";
import { studioDay } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager", "client"]);
    const params = request.nextUrl.searchParams;
    const page = await getClientHistoryService().list(actor, params.get("month") ?? studioDay().slice(0, 7), params.get("clientId") ?? undefined, params.get("after") ?? undefined);
    return NextResponse.json(page, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return error instanceof ManagementError ? NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } }) : authErrorResponse(error); }
}
