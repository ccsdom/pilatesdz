import { NextRequest, NextResponse } from "next/server";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { getCashReportService } from "@/lib/packages/cash-report";
import { ManagementError } from "@/domain/ports/access-management";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin"]);
    const month = request.nextUrl.searchParams.get("month") ?? "";
    const csv = await getCashReportService().exportCsv(actor, month);
    return new NextResponse(csv, { headers: {
      "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `attachment; filename="encaissements-${actor.centerId}-${month}.csv"`,
    } });
  } catch (error) {
    return error instanceof ManagementError ? NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } }) : authErrorResponse(error);
  }
}
