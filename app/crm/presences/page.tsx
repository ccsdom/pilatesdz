import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getPlanningService } from "@/lib/planning/server";
import { getRequestTime } from "@/lib/request-time";
import { studioDay } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { PendingAttendance } from "@/features/planning/pending-attendance";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Présences à renseigner — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const result = await getPageAccess(["admin", "manager"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const query = await searchParams, at = getRequestTime();
  const from = typeof query.from === "string" ? query.from : studioDay(at - 6 * 86400000);
  const to = typeof query.to === "string" ? query.to : studioDay(at);
  let report, errorMessage;
  try { report = await getPlanningService().pendingAttendance(result.access, from, to); }
  catch (error) { errorMessage = error instanceof ManagementError ? error.message : "Le suivi des présences est temporairement indisponible."; }
  return <ClientShell centerId={result.access.centerId} active="planning">
    <header className="space-y-3"><Link href="/crm" className="text-sm underline">Retour au tableau de bord</Link><h1 className="font-serif text-4xl">Suivi du pointage</h1><p className="text-sm">Retrouvez les cours terminés dont les présences restent à compléter, du plus ancien au plus récent.</p></header>
    <form action="/crm/presences" className="flex flex-wrap items-end gap-4"><div className="space-y-2"><label htmlFor="attendance-from">Du</label><Input key={from} id="attendance-from" name="from" type="date" defaultValue={from} required /></div><div className="space-y-2"><label htmlFor="attendance-to">Au</label><Input key={to} id="attendance-to" name="to" type="date" defaultValue={to} required /></div><Button type="submit">Afficher</Button><Link href="/crm/presences" className="self-center text-sm underline">Sept derniers jours</Link><p className="w-full text-xs text-muted-foreground">31 jours maximum par recherche. Les dates précédentes restent consultables.</p></form>
    {report ? <PendingAttendance report={report} /> : <p role="alert">{errorMessage}</p>}
  </ClientShell>;
}
