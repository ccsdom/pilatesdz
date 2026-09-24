import { NextRequest, NextResponse } from "next/server";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isTrustedMutation, readLimitedBody } from "@/lib/auth/request-policy";
import { getAttendanceService } from "@/lib/attendance/server";
import { ManagementError } from "@/domain/ports/access-management";
export const runtime = "nodejs";
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const failure = (error: unknown) => error instanceof ManagementError ? json({ error: error.message }, error.status) : authErrorResponse(error);
export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager"]);
    const params = request.nextUrl.searchParams;
    return json(await getAttendanceService().history(actor, params.get("id") ?? "", params.get("clientId") ?? "", params.has("before") ? Number(params.get("before")) : undefined));
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request.headers.get("origin"), request.headers.get("content-type"), process.env.APP_ORIGIN)) return json({ error: "Requête non autorisée." }, 403);
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager"]);
    let raw;
    try { raw = await readLimitedBody(request); } catch { return json({ error: "Requête trop volumineuse." }, 413); }
    let value;
    try { value = JSON.parse(raw); } catch { return json({ error: "Requête invalide." }, 400); }
    return json({ attendance: await getAttendanceService().mark(actor, value) });
  } catch (error) { return failure(error); }
}
