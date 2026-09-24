import { NextRequest, NextResponse } from "next/server";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { cashMonthSchema } from "@/domain/models/cash-report";
import { dashboardMonthDays, monthlyPlanning, formatMonthlyReportCsv } from "@/domain/models/dashboard-charts";
import { getPlanningService } from "@/lib/planning/server";
import { getCashReportService } from "@/lib/packages/cash-report";
import { ManagementError } from "@/domain/ports/access-management";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager"]);
    const parsed = cashMonthSchema.safeParse(request.nextUrl.searchParams.get("month"));
    if (!parsed.success) throw new ManagementError(400, "Choisissez un mois valide.");
    const month = parsed.data, days = dashboardMonthDays(month);
    const [sessions, cash] = await Promise.all([
      getPlanningService().rangeSessions(actor, days[0], days.at(-1)!),
      getCashReportService().chart(actor, month),
    ]);
    return new Response(formatMonthlyReportCsv(month, monthlyPlanning(month, sessions), cash), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pilates-center-alger-statistiques-${month}.csv"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ManagementError) return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    return authErrorResponse(error);
  }
}
