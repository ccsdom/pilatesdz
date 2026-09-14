import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getPlanningService } from "@/lib/planning/server";
import { studioDay } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { PlanningCalendar } from "@/features/planning/planning-calendar";
import { getRequestTime } from "@/lib/request-time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Planning — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ day?: string; after?: string }> }) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const params = await searchParams;
  const now = getRequestTime();
  let page;
  try { page = await getPlanningService().list(result.access, typeof params.day === "string" ? params.day : studioDay(now), typeof params.after === "string" ? params.after : undefined); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Planning temporairement indisponible."} />; }
  return <ClientShell centerId={result.access.centerId} active="planning"><header className="flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 text-sm text-[#957035]">Les séances du centre</p><h1 className="font-serif text-5xl">Planning</h1></div><Link href="/crm/planning/nouvelle" className="rounded-xl bg-[#111] px-5 py-3 text-sm font-medium text-white">Créer une séance</Link></header><Link href="/crm/presences" className="text-sm font-medium text-[#8d6729] underline">Voir les présences à renseigner</Link><PlanningCalendar page={page} admin now={now} /></ClientShell>;
}
