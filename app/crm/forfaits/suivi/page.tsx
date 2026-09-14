import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getPackageFollowupService } from "@/lib/packages/followup";
import { studioDay } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Suivi des forfaits — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ after?: string }> }) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const query = await searchParams;
  let report;
  try { report = await getPackageFollowupService().list(result.access, typeof query.after === "string" ? query.after : undefined); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Le suivi des forfaits est temporairement indisponible."} />; }
  return <ClientShell centerId={result.access.centerId} active="packages">
    <header className="space-y-3"><Link href="/crm/forfaits" className="text-sm underline">Retour aux forfaits</Link><h1 className="font-serif text-4xl">Forfaits à suivre</h1><p>Échéance dans les sept jours ou un crédit utilisable ou moins.</p><p className="text-sm text-muted-foreground">Fiches actives uniquement. Les crédits futurs sont séparés ; une fin de période mensuelle ne vaut pas fin d’abonnement trimestriel. Aucun message n’est envoyé automatiquement.</p></header>
    <p data-testid="package-followup-scope" className="text-sm">{report.scanned} fiche(s) examinée(s) sur cette page · {report.rows.length} cliente(s) à suivre. Parcourez les pages suivantes pour couvrir tout l’annuaire.</p>
    <section className="space-y-4" aria-label="Forfaits à suivre">{report.rows.length === 0 && <p>Aucune alerte parmi les fiches de cette page.</p>}{report.rows.map(row => <article key={row.clientId} className="space-y-3 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5"><h2 className="break-words font-serif text-2xl">{row.name}</h2><p className={row.low ? "font-medium text-[#765522]" : "text-sm"}>{row.remaining} crédit(s) utilisable(s) actuellement{row.low ? " — crédits faibles" : ""}</p>{row.future > 0 && <p className="text-sm">{row.future} crédit(s) sur des périodes futures, non utilisables aujourd’hui. Vérifiez ces périodes avant de proposer un renouvellement.</p>}{row.endings.map((ending, i) => <p key={i} className="text-sm">{ending.label} : dernier jour de validité le {studioDay(ending.expiresAt - 1).split("-").reverse().join("/")}</p>)}<Link href={`/crm/clientes/${row.clientId}/forfaits`} className="inline-block text-sm font-medium underline">Consulter les forfaits et abonnements</Link></article>)}</section>
    <nav className="flex gap-6 text-sm underline" aria-label="Pagination du suivi">{query.after && <Link href="/crm/forfaits/suivi">Première page</Link>}{report.next && <Link href={`/crm/forfaits/suivi?${new URLSearchParams({ after: report.next })}`}>Examiner les fiches suivantes</Link>}</nav>
  </ClientShell>;
}
