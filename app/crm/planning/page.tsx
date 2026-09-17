import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getPlanningService } from "@/lib/planning/server";
import {
  studioDay,
  weekRange,
  monthRange,
  getDaysOfWeek,
  getDaysOfMonthGrid,
  type PilatesSession,
} from "@/domain/models/planning";
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
  const result = await getPageAccess(["admin"]);
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
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-sm text-[#957035]">Les séances du centre</p>
          <h1 className="font-serif text-5xl">Planning CRM</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/crm/presences"
            className="text-sm font-semibold text-[#8d6729] underline hover:text-[#111] transition-colors"
          >
            Voir les présences à renseigner
          </Link>
          <Link
            href="/crm/planning/nouvelle"
            className="rounded-xl bg-[#111] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[#222] transition-all"
          >
            + Créer une séance
          </Link>
        </div>
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
