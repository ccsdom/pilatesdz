import Link from "next/link";
import styles from "@/features/auth/access-manager.module.css";
import { FieldPath } from "firebase-admin/firestore";
import { getPageAccess } from "@/lib/auth/page-access";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { AccessErrorView } from "@/features/auth/access-error";
import { AccessManager } from "@/features/auth/access-manager";
import { ClientShell } from "@/features/clients/client-shell";
import { ArrowLeft, ArrowRight, KeyRound, ShieldCheck } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Gestion des accès — Pilates Center Alger",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ after?: string }>;
}) {
  const result = await getPageAccess(["admin", "manager"]);
  if (!result.access) return <AccessErrorView message={result.error} />;

  const { after } = await searchParams;
  if (after && (after.length > 128 || after.includes("/"))) {
    return <AccessErrorView message="Page invalide." />;
  }

  let members;
  let next;
  try {
    let query = getFirebaseAdmin()
      .firestore.collection(`centers/${result.access.centerId}/members`)
      .orderBy(FieldPath.documentId())
      .limit(51);
    if (after) query = query.startAfter(after);
    const snapshot = await query.get();
    const page = snapshot.docs.slice(0, 50);
    next = snapshot.size > 50 ? page.at(-1)?.id : undefined;
    members = page.flatMap((doc) => {
      const data = doc.data();
      if (
        data.uid !== doc.id ||
        data.centerId !== result.access.centerId ||
        !["client", "manager"].includes(data.role) ||
        typeof data.active !== "boolean"
      )
        return [];
      return [
        {
          uid: doc.id,
          email: typeof data.email === "string" ? data.email : "",
          name: typeof data.name === "string" ? data.name : doc.id,
          active: data.active,
          role: data.role as "client" | "manager",
          ...(typeof data.clientId === "string" &&
          /^[a-zA-Z0-9_-]{1,128}$/.test(data.clientId)
            ? { clientId: data.clientId }
            : {}),
        },
      ];
    });
  } catch {
    return (
      <AccessErrorView message="Les accès sont temporairement indisponibles. Réessayez plus tard." />
    );
  }

  return (
    <ClientShell centerId={result.access.centerId} active="access">
      <header className={styles.hero}>
        <div className={styles.heroBody}><div><p className={styles.eyebrow}>PILATES DZ · Administration</p><h1>Les bons accès,<br /><em>pour chaque personne.</em></h1><p className={styles.intro}>Un espace personnel pour vos clientes, un accès au CRM pour vos managers.</p></div><span className={styles.heroIcon} aria-hidden="true"><KeyRound size={36} strokeWidth={1.2} /></span></div>
        <p className="relative mt-6 flex items-start gap-2.5 border-t border-white/10 pt-5 text-xs leading-5 text-[#c6bcab]"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#d8b97f]" /><span>
          {process.env.FIREBASE_USE_EMULATORS === "false"
            ? "Les invitations sont envoyées par e-mail via Firebase. La personne invitée choisit son mot de passe. Aucun lien de connexion privé n’est affiché ici."
            : "Démonstration locale : aucun e-mail réel n’est envoyé. Les liens de test permettent de choisir un mot de passe."}
        </span></p>
      </header>

      <AccessManager members={members} role={result.access.role as "admin" | "manager"} />

      <nav className="flex flex-wrap items-center justify-between gap-4 border-t border-[#b7893b]/20 pt-5 text-xs" aria-label="Pages des accès">
        <p className="text-[#847969] dark:text-[#b4a898]">{members.length} accès sur cette page · {next ? "Suite disponible" : "Fin de la liste"}</p>
        <div className="flex gap-3">{after && <Link href="/crm/acces" className="inline-flex items-center gap-2 rounded-xl border border-[#b7893b]/25 px-4 py-2.5"><ArrowLeft size={14} />Première page</Link>}
        {next && (
          <Link href={`/crm/acces?after=${encodeURIComponent(next)}`} className="inline-flex items-center gap-2 rounded-xl border border-[#b7893b]/25 px-4 py-2.5">
            Page suivante<ArrowRight size={14} />
          </Link>
        )}</div>
      </nav>
    </ClientShell>
  );
}
