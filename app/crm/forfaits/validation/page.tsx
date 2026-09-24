import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { settlementRepository } from "@/repositories/firestore/credit-settlement";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { CreditSettings } from "@/features/packages/credit-settings";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Validation des séances — Pilates Center", robots: { index: false, follow: false } };
export default async function Page() {
  const result = await getPageAccess(["admin", "manager"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  let settings, pending;
  try { const repository = settlementRepository(getFirebaseAdmin().firestore); [settings, pending] = await Promise.all([repository.settings(result.access), repository.pending(result.access)]); }
  catch { return <AccessErrorView message="La validation des séances est temporairement indisponible." />; }
  return <ClientShell centerId={result.access.centerId} active="packages"><Link href="/crm/forfaits" className="text-sm underline">Retour aux forfaits</Link><h1 className="font-serif text-4xl">Validation des séances</h1><CreditSettings key={settings.version} settings={settings} /><section className="space-y-4"><h2 className="font-serif text-2xl">Crédits en attente de décision</h2><p className="text-sm text-muted-foreground">Créneaux terminés, du plus ancien au plus récent. Ouvrez un créneau pour consommer ou restituer le crédit.</p>{pending.items.length === 0 && <p className="rounded-xl border p-6">Aucune validation en attente.</p>}{pending.items.map(item => <Link key={item.id} href={`/crm/planning/${item.sessionId}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-5"><span><strong className="block text-sm">{item.name}</strong><span className="text-xs text-muted-foreground">Fin du créneau : {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Algiers" }).format(item.endsAt)}</span></span><span className="text-sm underline">Valider le crédit</span></Link>)}{pending.more && <p className="text-sm">50 premières décisions affichées. Traitez-les pour faire apparaître les suivantes.</p>}</section></ClientShell>;
}
