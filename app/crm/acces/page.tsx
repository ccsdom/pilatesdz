import Link from "next/link";
import { FieldPath } from "firebase-admin/firestore";
import { getPageAccess } from "@/lib/auth/page-access";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { AccessErrorView } from "@/features/auth/access-error";
import { AccessManager } from "@/features/auth/access-manager";
import { LogoutButton } from "@/features/auth/logout-button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Gestion des accès — Pilates Center Alger", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Page({ searchParams }: { searchParams: Promise<{ after?: string }> }) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const { after } = await searchParams;
  if (after && (after.length > 128 || after.includes("/"))) return <AccessErrorView message="Page invalide." />;
  let members;
  let next;
  try {
    let query = getFirebaseAdmin().firestore.collection(`centers/${result.access.centerId}/members`).orderBy(FieldPath.documentId()).limit(51);
    if (after) query = query.startAfter(after);
    const snapshot = await query.get();
    const page = snapshot.docs.slice(0, 50);
    next = snapshot.size > 50 ? page.at(-1)?.id : undefined;
    members = page.flatMap((doc) => {
      const data = doc.data();
      if (data.uid !== doc.id || data.centerId !== result.access.centerId || data.role !== "client" || typeof data.active !== "boolean") return [];
      return [{ uid: doc.id, email: typeof data.email === "string" ? data.email : "", name: typeof data.name === "string" ? data.name : doc.id, active: data.active, ...(typeof data.clientId === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(data.clientId) ? { clientId: data.clientId } : {}) }];
    });
  } catch { return <AccessErrorView message="Les accès sont temporairement indisponibles. Réessayez plus tard." />; }
  return <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
    <nav className="flex flex-wrap items-center justify-between gap-4"><Link href="/crm" className="text-sm underline">Retour au CRM</Link><Link href="/crm/clientes" className="text-sm underline">Fiches clientes</Link><LogoutButton /></nav>
    <header className="space-y-3"><p className="text-sm text-muted-foreground">Administration · Centre {result.access.centerId}</p><h1 className="font-serif text-4xl sm:text-5xl">Gestion des accès</h1><p>Invitez une cliente ou désactivez son accès à ce centre.</p><p className="rounded-xl border border-[#d5ae65] p-4 text-sm">Démonstration locale : aucun e-mail réel n’est envoyé. Les liens de test permettent de choisir un mot de passe.</p></header>
    <AccessManager members={members} />
    <nav className="flex gap-6 text-sm underline" aria-label="Pages des accès">{after && <Link href="/crm/acces">Première page</Link>}{next && <Link href={`/crm/acces?after=${encodeURIComponent(next)}`}>Page suivante</Link>}</nav>
  </main>;
}
