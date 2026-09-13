import { CrmPreview } from "@/features/crm/crm-preview";
import { getPageAccess } from "@/lib/auth/page-access";
import { AccessErrorView } from "@/features/auth/access-error";
import { LogoutButton } from "@/features/auth/logout-button";
import Link from "next/link";
import { getClientService } from "@/lib/clients/server";
import { getPlanningService } from "@/lib/planning/server";
import { studioDay, STUDIO_TIME_ZONE } from "@/domain/models/planning";
import { getRequestTime } from "@/lib/request-time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { title: "Aperçu CRM — Pilates Center Alger", robots: { index: false, follow: false } };

export default async function CrmPage() {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  let clients;
  let planning;
  const now = getRequestTime();
  try {
    const [clientPage, planningPage] = await Promise.all([getClientService().list(result.access), getPlanningService().list(result.access, studioDay(now))]);
    clients = clientPage.clients.slice(0, 3); planning = planningPage.sessions.slice(0, 4);
  }
  catch { return <AccessErrorView message="Le CRM est temporairement indisponible." />; }
  const dayLabel = new Intl.DateTimeFormat("fr-FR", { timeZone: STUDIO_TIME_ZONE, weekday: "long", day: "numeric", month: "long" }).format(now);
  return <><div className="flex flex-wrap items-center justify-between gap-3 bg-[#080808] px-5 py-4 text-sm text-[#d5ae65]"><span>Clientes, planning et forfaits enregistrés localement · Finances de démonstration</span><Link href="/crm/planning" className="underline">Planning</Link><Link href="/crm/clientes" className="underline">Clientes</Link><Link href="/crm/forfaits" className="underline">Forfaits</Link><Link href="/crm/acces" className="underline">Gestion des accès</Link><LogoutButton /></div><CrmPreview clients={clients} planning={planning} dayLabel={dayLabel} /></>;
}
