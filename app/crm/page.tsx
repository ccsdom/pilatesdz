import { CrmPreview } from "@/features/crm/crm-preview";
import { getPageAccess } from "@/lib/auth/page-access";
import { AccessErrorView } from "@/features/auth/access-error";
import { LogoutButton } from "@/features/auth/logout-button";
import Link from "next/link";
import { getClientService } from "@/lib/clients/server";
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
    return <section className="rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5"><p>Le suivi des présences est temporairement indisponible.</p><Link href="/crm/presences" className="text-sm underline">Consulter le suivi et choisir une période</Link></section>;
  }
  return <PendingAttendance report={report} compact />;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { title: "Tableau de bord — Pilates Center Alger", robots: { index: false, follow: false } };

export default async function CrmPage() {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  let clients;
  let planning, summary;
  const now = getRequestTime();
  try {
    const [clientPage, sessions] = await Promise.all([getClientService().list(result.access), getPlanningService().daySessions(result.access, studioDay(now))]);
    summary = summarizeDay(sessions);
    clients = clientPage.clients.slice(0, 3);
    planning = sessions.slice(0, 4).map(session => ({ session, myBooking: "none" as const }));
  }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Le CRM est temporairement indisponible."} />; }
  const dayLabel = new Intl.DateTimeFormat("fr-FR", { timeZone: STUDIO_TIME_ZONE, weekday: "long", day: "numeric", month: "long" }).format(now);
  return <><div className="flex flex-wrap items-center justify-between gap-3 bg-[#080808] px-5 py-4 text-sm text-[#d5ae65]"><span>Activité du centre · Heure d’Alger</span><Link href="/crm/planning" className="underline">Planning</Link><Link href="/crm/clientes" className="underline">Clientes</Link><Link href="/crm/forfaits" className="underline">Forfaits</Link><Link href="/crm/encaissements" className="underline">Encaissements</Link><Link href="/crm/encaissements/soldes" className="underline">Soldes à vérifier</Link><Link href="/crm/acces" className="underline">Gestion des accès</Link><LogoutButton /></div><CrmPreview attendance={<><AttendanceSummary access={result.access} at={now} /><section className="rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5"><h2 className="font-serif text-2xl">Suivi des forfaits</h2><p className="my-3 text-sm">Repérez les échéances des sept prochains jours et les crédits faibles.</p><Link href="/crm/forfaits/suivi" className="text-sm font-medium text-[#8d6729] underline">Consulter les clientes à suivre</Link></section></>} summary={summary} clients={clients} planning={planning} dayLabel={dayLabel} /></>;
}
