import type { Access } from "@/domain/models/access";
import { dashboardMonthDays, monthlyPlanning } from "@/domain/models/dashboard-charts";
import { getPlanningService } from "@/lib/planning/server";
import { getCashReportService } from "@/lib/packages/cash-report";
import { ManagementError } from "@/domain/ports/access-management";
import { DashboardCharts } from "./dashboard-charts";

export async function DashboardAnalytics({ access, month }: { access: Access; month: string }) {
  const days = dashboardMonthDays(month);
  const [planning, cash] = await Promise.allSettled([
    getPlanningService().rangeSessions(access, days[0], days.at(-1)!).then(sessions => monthlyPlanning(month, sessions)),
    getCashReportService().chart(access, month),
  ]);
  const error = (reason: unknown) => reason instanceof ManagementError ? reason.message : "Données temporairement indisponibles. Réessayez en actualisant la page.";
  return <DashboardCharts month={month} planning={planning.status === "fulfilled" ? planning.value : null} cash={cash.status === "fulfilled" ? cash.value : null} planningError={planning.status === "rejected" ? error(planning.reason) : undefined} cashError={cash.status === "rejected" ? error(cash.reason) : undefined} />;
}
