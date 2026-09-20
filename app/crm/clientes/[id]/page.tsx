import { getPageAccess } from "@/lib/auth/page-access";
import { getClientService } from "@/lib/clients/server";
import { ClientShell } from "@/features/clients/client-shell";
import { ClientProfileView } from "@/features/clients/client-profile";
import { AccessErrorView } from "@/features/auth/access-error";
import { ManagementError } from "@/domain/ports/access-management";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Fiche cliente — Pilates Center Alger", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  let details;
  try { details = await getClientService().get(result.access, (await params).id); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "La fiche cliente est temporairement indisponible."} />; }
  return <ClientShell centerId={result.access.centerId}><ClientProfileView details={details} /></ClientShell>;
}
