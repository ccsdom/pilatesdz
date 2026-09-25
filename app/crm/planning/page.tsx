import Link from "next/link";
import { ArrowUpRight, ClipboardCheck } from "lucide-react";
import styles from "@/features/planning/planning-premium.module.css";
import { getPageAccess } from "@/lib/auth/page-access";
import { getPlanningService } from "@/lib/planning/server";
import { studioDay, getDaysOfWeek, getDaysOfMonthGrid, type PilatesSession } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { CrmPlanningViews, type ViewMode } from "@/features/planning/crm-planning-views";
import { getRequestTime } from "@/lib/request-time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Planning — Pilates Center Alger", robots: { index: false, follow: false } };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; view?: string }>;
}) {
  const result = await getPageAccess(["admin", "manager"]);
  if (!result.access) return <AccessErrorView message={result.error} />;

  const params = await searchParams;
  const now = getRequestTime();
  const dayStr = typeof params.day === "string" ? params.day : studioDay(now);
  const view: ViewMode = (["grid", "day", "week", "month"].includes(params.view || "")
    ? params.view
    : "week") as ViewMode;

  let sessions: PilatesSession[] = [];

  try {
    const service = getPlanningService();

    if (view === "week") {
      const weekDays = getDaysOfWeek(dayStr);
      sessions = await service.rangeSessions(result.access, weekDays[0], weekDays[6]);
    } else if (view === "month") {
      const ym = dayStr.slice(0, 7);
      const grid = getDaysOfMonthGrid(ym);
      sessions = await service.rangeSessions(result.access, grid[0].date, grid[grid.length - 1].date);
    } else {
      sessions = await service.daySessions(result.access, dayStr);
    }
  } catch (error) {
    return (
      <AccessErrorView
        message={
          error instanceof ManagementError
            ? error.message
            : "Planning temporairement indisponible."
        }
      />
    );
  }

  return (
    <ClientShell centerId={result.access.centerId} active="planning">
      <header className={styles.hero}>
        <div><p className={styles.eyebrow}>PILATES DZ · Le planning</p><h1>Chaque heure,<br /><em>une nouvelle énergie.</em></h1><p className={styles.description}>Organisez les créneaux, visualisez les places et accompagnez chaque séance.</p></div>
        <Link href="/crm/presences" className={styles.presences}><ClipboardCheck size={20} aria-hidden="true" /><span>Suivi des présences<small>Voir les présences à renseigner</small></span><ArrowUpRight size={18} aria-hidden="true" /></Link>
      </header>

      <CrmPlanningViews
        sessions={sessions}
        initialView={view}
        initialDay={dayStr}
        now={now}
      />
    </ClientShell>
  );
}
