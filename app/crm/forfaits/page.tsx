import { PackagesOverview } from "@/features/packages/packages-overview";
import { getPageAccess } from "@/lib/auth/page-access";
import { getClientService } from "@/lib/clients/server";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { ManagementError } from "@/domain/ports/access-management";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Forfaits — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; after?: string }> }) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  let page;
  try { page = await getClientService().list(result.access, q, typeof params.after === "string" ? params.after : undefined); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Annuaire temporairement indisponible."} />; }
  return <ClientShell centerId={result.access.centerId} active="packages"><PackagesOverview page={page} q={q} after={typeof params.after === "string" ? params.after : undefined} /></ClientShell>;
}
