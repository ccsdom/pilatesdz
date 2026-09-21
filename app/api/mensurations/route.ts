import { NextRequest, NextResponse } from "next/server";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { personalMeasurements } from "@/lib/clients/personal-measurements";
import { ManagementError } from "@/domain/ports/access-management";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["client"]);
    if ([...request.nextUrl.searchParams.keys()].some(key => key !== "after")) return NextResponse.json({ error: "Paramètre non autorisé." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(await personalMeasurements(actor, request.nextUrl.searchParams.get("after") ?? undefined), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ManagementError) return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    return authErrorResponse(error);
  }
}
