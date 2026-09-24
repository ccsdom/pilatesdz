import { NextRequest, NextResponse } from "next/server";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { getPlanningService } from "@/lib/planning/server";
import { studioDay } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } });
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager"]);
    const at = Date.now(), query = request.nextUrl.searchParams;
    return json(await getPlanningService().pendingAttendance(actor, query.get("from") ?? studioDay(at - 6 * 86400000), query.get("to") ?? studioDay(at)));
  } catch (error) { return error instanceof ManagementError ? json({ error: error.message }, error.status) : authErrorResponse(error); }
}
