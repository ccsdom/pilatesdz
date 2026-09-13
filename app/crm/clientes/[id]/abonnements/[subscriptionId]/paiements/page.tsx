import { PaymentCorrectionForm } from "@/features/packages/payment-correction-form";
import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getPaymentService } from "@/lib/packages/payments";
import { getClientService } from "@/lib/clients/server";
import { getRequestTime } from "@/lib/request-time";
import { studioDay } from "@/domain/models/planning";
import { formatCashAmount } from "@/domain/models/payment";
import { ManagementError } from "@/domain/ports/access-management";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { PaymentForm } from "@/features/packages/payment-form";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Encaissements — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ params, searchParams }: {
  params: Promise<{ id: string; subscriptionId: string }>; searchParams: Promise<{ after?: string }>;
}) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const { id, subscriptionId } = await params;
  const query = await searchParams;
  const after = typeof query.after === "string" ? query.after : undefined;
  let page, client;
  try { [page, client] = await Promise.all([getPaymentService().list(result.access, id, subscriptionId, after), getClientService().get(result.access, id)]); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Journal temporairement indisponible."} />; }
  const basePath = `/crm/clientes/${id}/abonnements/${subscriptionId}/paiements`;
  return <ClientShell centerId={result.access.centerId} active="packages">
    <Link href={`/crm/clientes/${id}/forfaits`} className="underline">Retour aux abonnements</Link>
    <h1 className="font-serif text-4xl">Encaissements · {client.profile.name}</h1>
    <p>Abonnement débutant le {page.purchaseDate}. Le journal retrace les espèces déclarées reçues par le centre.</p>
    <dl className="grid gap-4 rounded-2xl border bg-[#fffdf9] p-6 sm:grid-cols-3">
      <div><dt>Tarif enregistré</dt><dd className="text-xl">{formatCashAmount(page.totalMinor)}</dd></div>
      <div><dt>Espèces enregistrées</dt><dd className="text-xl">{formatCashAmount(page.paidMinor)}</dd></div>
      <div><dt>Solde restant à enregistrer</dt><dd className="text-xl">{formatCashAmount(page.totalMinor - page.paidMinor)}</dd></div>
    </dl>
    <p className="text-sm text-muted-foreground">Un encaissement non renseigné a pu être reçu en dehors de l’application. Vérifiez le journal avant de saisir un paiement antérieur ; l’absence d’écriture ne prouve pas un impayé.</p>
    <PaymentForm clientId={id} subscriptionId={subscriptionId} remaining={page.totalMinor - page.paidMinor} purchaseDate={page.purchaseDate} today={studioDay(getRequestTime())} clientName={client.profile.name} />
    <section className="space-y-4"><h2 className="font-serif text-2xl">Journal des encaissements</h2>
      {page.payments.length === 0 && <p>Aucun encaissement renseigné.</p>}
      {page.payments.map(payment => <article key={payment.id} className="space-y-2 rounded-xl border p-4"><p className={payment.correction ? "font-semibold line-through" : "font-semibold"}>{formatCashAmount(payment.amountMinor)} · Espèces</p><p>Reçues le {payment.receivedDate} · saisies le {studioDay(payment.recordedAt)}</p><p className="break-all text-xs text-muted-foreground">Référence : {payment.id}</p>{payment.correction ? <div className="rounded-lg bg-[#f7efe4] p-3 text-sm"><p className="font-semibold">Saisie annulée le {studioDay(payment.correction.recordedAt)} · exclue du cumul</p><p>Motif : {payment.correction.reason}</p><p className="break-all text-xs">Correction : {payment.correction.id}</p></div> : <PaymentCorrectionForm clientId={id} subscriptionId={subscriptionId} payment={payment} />}</article>)}
      <nav aria-label="Pagination des encaissements" className="flex gap-5 underline">{after && <Link href={basePath}>Encaissements récents</Link>}{page.next && <Link href={`${basePath}?${new URLSearchParams({ after: page.next })}`}>Encaissements plus anciens</Link>}</nav>
    </section>
  </ClientShell>;
}
