import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getOpenBalanceService } from "@/lib/packages/open-balances";
import { formatCashAmount } from "@/domain/models/payment";
import { ManagementError } from "@/domain/ports/access-management";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { Receipt } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Soldes à vérifier — Pilates Center Alger", robots: { index: false, follow: false } };
const labels = { partial: "Encaissement partiel enregistré", none: "Aucun paiement enregistré", history: "Historique d’encaissement, montant net nul", settled: "Solde enregistré" };
export default async function Page({ searchParams }: { searchParams: Promise<{ after?: string }> }) {
  const result = await getPageAccess(["admin", "manager"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const query = await searchParams;
  let report;
  try { report = await getOpenBalanceService().list(result.access, typeof query.after === "string" ? query.after : undefined); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Le suivi des soldes est temporairement indisponible."} />; }
  return <ClientShell centerId={result.access.centerId} active="cash">
    <header className="space-y-3"><Link href="/crm/encaissements" className="text-sm underline">Retour aux encaissements</Link><div className="flex items-center gap-3"><Receipt className="h-8 w-8 text-[#b7893b]" /><h1 className="font-serif text-4xl">Soldes à vérifier</h1></div><p>Abonnements dont le montant n’est pas entièrement couvert par les encaissements saisis.</p><p className="text-sm text-muted-foreground">Une absence de saisie ne prouve pas un impayé. Vérifiez le journal avant tout échange avec la cliente. Les fiches inactives et les abonnements terminés restent inclus ; aucune relance n’est envoyée.</p></header>
    <section className="space-y-2 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5"><h2 className="font-serif text-2xl">Reste à enregistrer sur cette page</h2><p className="text-2xl font-medium">{formatCashAmount(report.remainingMinor)}</p><p data-testid="open-balance-scope" className="text-sm">{report.scanned} fiche(s) examinée(s) · {report.rows.length} abonnement(s) avec un solde ouvert.</p><p className="text-xs text-muted-foreground">Ce montant concerne uniquement les fiches de cette page. Parcourez les pages suivantes pour couvrir tout l’annuaire.</p></section>
    <section aria-label="Abonnements à vérifier" className="space-y-4">{report.rows.length === 0 && <p>Aucun solde ouvert parmi les fiches de cette page.</p>}{report.rows.map(row => <article key={`${row.clientId}/${row.subscriptionId}`} className="space-y-3 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5"><h2 className="break-words font-serif text-2xl">{row.name}</h2>{!row.active && <p className="text-xs">Fiche inactive</p>}<p className="text-sm">{row.offerId === "monthly-4" ? "4" : "8"} séances / mois · {row.term === "quarterly" ? "Trimestriel" : "Mensuel"} · Achat du {row.purchaseDate.split("-").reverse().join("/")}</p><p className="font-medium text-[#765522]">{labels[row.state]}</p><dl className="grid gap-3 text-sm sm:grid-cols-3"><div><dt>Montant de l’abonnement</dt><dd>{formatCashAmount(row.totalMinor)}</dd></div><div><dt>Enregistré après corrections</dt><dd>{formatCashAmount(row.paidMinor)}</dd></div><div><dt>Reste à enregistrer</dt><dd className="font-semibold">{formatCashAmount(row.remainingMinor)}</dd></div></dl><Link href={`/crm/clientes/${row.clientId}/abonnements/${row.subscriptionId}/paiements`} className="inline-block text-sm font-medium underline">Ouvrir le journal et enregistrer des espèces</Link></article>)}</section>
    <nav className="flex gap-6 text-sm underline" aria-label="Pagination des soldes">{query.after && <Link href="/crm/encaissements/soldes">Première page</Link>}{report.next && <Link href={`/crm/encaissements/soldes?${new URLSearchParams({ after: report.next })}`}>Examiner les fiches suivantes</Link>}</nav>
  </ClientShell>;
}

