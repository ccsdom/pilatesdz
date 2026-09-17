import { NextRequest, NextResponse } from "next/server";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { getPlanningService } from "@/lib/planning/server";
import { ManagementError } from "@/domain/ports/access-management";

export const runtime = "nodejs";

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthService().authorize(
      request.cookies.get(SESSION_COOKIE)?.value,
      ["admin"]
    );
    const after = request.nextUrl.searchParams.get("after") || undefined;
    const res = await getPlanningService().listReservations(actor, after, 20);
    return json(res);
  } catch (error) {
    if (error instanceof ManagementError) return json({ error: error.message }, error.status);
    return authErrorResponse(error);
  }
}
