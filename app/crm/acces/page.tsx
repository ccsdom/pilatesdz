import Link from "next/link";
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
  const result = await getPageAccess(["admin"]);
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
        data.role !== "client" ||
        typeof data.active !== "boolean"
      )
        return [];
      return [
        {
          uid: doc.id,
          email: typeof data.email === "string" ? data.email : "",
          name: typeof data.name === "string" ? data.name : doc.id,
          active: data.active,
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
      <header className="relative overflow-hidden rounded-3xl border border-[#b7893b]/25 bg-[#201f1a] p-6 text-[#fff8eb] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-[#d8b97f]/15" />
        <div className="relative flex items-start justify-between gap-5"><div><p className="mb-4 text-[10px] font-medium uppercase tracking-[0.25em] text-[#d8b97f]">Administration · Votre centre</p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl">Gestion des accès<span className="text-[#d8b97f]">.</span></h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#c6bcab]">Un espace personnel pour chaque cliente, des accès maîtrisés pour votre équipe.</p></div><span className="hidden rounded-2xl border border-[#d8b97f]/20 bg-[#d8b97f]/10 p-4 text-[#d8b97f] sm:inline-flex"><KeyRound size={30} strokeWidth={1.2} /></span></div>
        <p className="relative mt-6 flex items-start gap-2.5 border-t border-white/10 pt-5 text-xs leading-5 text-[#c6bcab]"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#d8b97f]" /><span>
          {process.env.FIREBASE_USE_EMULATORS === "false"
            ? "Les invitations sont envoyées par e-mail via Firebase. La cliente choisit elle-même son mot de passe. Aucun lien de connexion privé n’est affiché ici."
            : "Démonstration locale : aucun e-mail réel n’est envoyé. Les liens de test permettent de choisir un mot de passe."}
        </span></p>
      </header>

      <AccessManager members={members} />

      <nav className="flex flex-wrap items-center justify-between gap-4 border-t border-[#b7893b]/20 pt-5 text-xs" aria-label="Pages des accès">
        <p className="text-[#847969] dark:text-[#b4a898]">{members.length} accès cliente(s) sur cette page · {next ? "Suite disponible" : "Fin de la liste"}</p>
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
