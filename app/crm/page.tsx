import { CrmPreview } from "@/features/crm/crm-preview";
import { getPageAccess } from "@/lib/auth/page-access";
import { AccessErrorView } from "@/features/auth/access-error";
import { CrmHeader } from "@/features/crm/crm-header";
import Link from "next/link";
import { CalendarDays, UsersRound, WalletCards, CreditCard, Receipt, KeyRound } from "lucide-react";
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
    return <section className="rounded-2xl border border-[#ded4c3] dark:border-[#332e26] bg-[#fffdf9] dark:bg-[#181613] p-5"><p>Le suivi des présences est temporairement indisponible.</p><Link href="/crm/presences" className="text-sm underline">Consulter le suivi et choisir une période</Link></section>;
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
  return (
    <div className="min-h-screen bg-[#f3eee5] text-[#1c1b19] dark:bg-[#0f0e0c] dark:text-[#f4ede2]">
      <CrmHeader centerId={result.access.centerId} title="Tableau de bord" />
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#080808] dark:bg-[#141210] px-5 py-3 text-sm text-[#d5ae65]">
        <span>Accès rapides CRM</span>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/crm/planning" className="inline-flex items-center gap-1.5 underline hover:text-white transition-colors"><CalendarDays className="h-4 w-4" />Planning</Link>
          <Link href="/crm/clientes" className="inline-flex items-center gap-1.5 underline hover:text-white transition-colors"><UsersRound className="h-4 w-4" />Clientes</Link>
          <Link href="/crm/forfaits" className="inline-flex items-center gap-1.5 underline hover:text-white transition-colors"><WalletCards className="h-4 w-4" />Forfaits</Link>
          <Link href="/crm/encaissements" className="inline-flex items-center gap-1.5 underline hover:text-white transition-colors"><CreditCard className="h-4 w-4" />Encaissements</Link>
          <Link href="/crm/encaissements/soldes" className="inline-flex items-center gap-1.5 underline hover:text-white transition-colors"><Receipt className="h-4 w-4" />Soldes à vérifier</Link>
          <Link href="/crm/acces" className="inline-flex items-center gap-1.5 underline hover:text-white transition-colors"><KeyRound className="h-4 w-4" />Gestion des accès</Link>
        </div>
      </div>
      <CrmPreview attendance={<><AttendanceSummary access={result.access} at={now} /><section className="rounded-2xl border border-[#ded4c3] dark:border-[#332e26] bg-[#fffdf9] dark:bg-[#181613] p-5"><div className="flex items-center gap-2 mb-1"><WalletCards className="h-5 w-5 text-[#8d6729] dark:text-[#d5ae65]" /><h2 className="font-serif text-2xl">Suivi des forfaits</h2></div><p className="my-3 text-sm">Repérez les échéances des sept prochains jours et les crédits faibles.</p><Link href="/crm/forfaits/suivi" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8d6729] dark:text-[#d5ae65] underline"><WalletCards className="h-4 w-4" />Consulter les clientes à suivre</Link></section></>} summary={summary} clients={clients} planning={planning} dayLabel={dayLabel} />
    </div>
  );
}
