import { getPageAccess } from "@/lib/auth/page-access";
import { studioDay } from "@/domain/models/planning";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { SessionForm } from "@/features/planning/session-form";
import { getRequestTime } from "@/lib/request-time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Nouvelle séance — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page() {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  return <ClientShell centerId={result.access.centerId} active="planning"><header><p className="mb-2 text-sm text-[#957035]">Planning du centre</p><h1 className="font-serif text-4xl sm:text-5xl">Nouvelle séance</h1></header><SessionForm defaultDateTime={`${studioDay(getRequestTime() + 86400000)}T18:00`} /></ClientShell>;
}
