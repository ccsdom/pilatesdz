import { getPageAccess } from "@/lib/auth/page-access";
import { ClientShell } from "@/features/clients/client-shell";
import { ClientForm } from "@/features/clients/client-form";
import { AccessErrorView } from "@/features/auth/access-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Nouvelle cliente — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page() {
  const result = await getPageAccess(["admin", "manager"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  return <ClientShell centerId={result.access.centerId}><header><p className="mb-2 text-sm text-[#957035]">Annuaire du centre</p><h1 className="font-serif text-4xl sm:text-5xl">Nouvelle cliente</h1><p className="mt-4 text-sm text-muted-foreground">Enregistrez ses coordonnées. Vous pourrez ensuite l’inviter à son espace.</p></header><ClientForm /></ClientShell>;
}
