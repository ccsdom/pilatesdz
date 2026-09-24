import { CrmPreview } from "@/features/crm/crm-preview";
import { getPageAccess } from "@/lib/auth/page-access";
import { AccessErrorView } from "@/features/auth/access-error";
import { ClientShell } from "@/features/clients/client-shell";
import Link from "next/link";
import { WalletCards } from "lucide-react";
import { DashboardAnalytics } from "@/features/crm/dashboard-analytics";
import { cashMonthSchema } from "@/domain/models/cash-report";
import { getPlanningService } from "@/lib/planning/server";
import { studioDay, STUDIO_TIME_ZONE } from "@/domain/models/planning";
import { getRequestTime } from "@/lib/request-time";
import { summarizeDay } from "@/domain/models/dashboard";
import { ManagementError } from "@/domain/ports/access-management";
import type { Access } from "@/domain/models/access";
import { PendingAttendance } from "@/features/planning/pending-attendance";

async function AttendanceSummary({ access, at }: { access: Access; at: number }) {
  let report;
  try {
    report = await getPlanningService().pendingAttendance(access, studioDay(at - 6 * 86400000), studioDay(at));
  } catch {
    return <section className="rounded-2xl border border-[#ded4c3] dark:border-[#332e26] bg-[#fffdf9] dark:bg-[#181613] p-5"><p>Le suivi des présences est temporairement indisponible.</p><Link href="/crm/presences" className="text-sm underline">Consulter le suivi et choisir une période</Link></section>;
  }
  return <PendingAttendance report={report} compact />;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { title: "Tableau de bord — Pilates Center Alger", robots: { index: false, follow: false } };

export default async function CrmPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const result = await getPageAccess(["admin", "manager"]);
  if (!result.access) return <AccessErrorView message={result.error} />;

  let summary;
  const now = getRequestTime();
  const params = await searchParams;
  const month = cashMonthSchema.safeParse(params.month).success ? params.month! : studioDay(now).slice(0, 7);
  try {
    const sessions = await getPlanningService().daySessions(result.access, studioDay(now));
    summary = summarizeDay(sessions);


  }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Le CRM est temporairement indisponible."} />; }
  const dayLabel = new Intl.DateTimeFormat("fr-FR", { timeZone: STUDIO_TIME_ZONE, weekday: "long", day: "numeric", month: "long" }).format(now);
  return (
    <ClientShell centerId={result.access.centerId} active="dashboard">
      <CrmPreview canManageAccess={result.access.role === "admin"} analytics={<DashboardAnalytics access={result.access} month={month} />} attendance={<><AttendanceSummary access={result.access} at={now} /><section className="rounded-2xl border border-[#ded4c3] dark:border-[#332e26] bg-[#fffdf9] dark:bg-[#181613] p-5"><div className="flex items-center gap-2 mb-1"><WalletCards className="h-5 w-5 text-[#8d6729] dark:text-[#d5ae65]" /><h2 className="font-serif text-2xl">Suivi des forfaits</h2></div><p className="my-3 text-sm">Repérez les échéances des sept prochains jours et les crédits faibles.</p><Link href="/crm/forfaits/suivi" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8d6729] dark:text-[#d5ae65] underline"><WalletCards className="h-4 w-4" />Consulter les clientes à suivre</Link></section></>} summary={summary} dayLabel={dayLabel} />
    </ClientShell>
  );
}
