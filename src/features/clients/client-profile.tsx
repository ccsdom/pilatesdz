import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, History, Mail, Phone, Ruler, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import type { ClientDetails } from "@/domain/models/client";
import { ClientForm } from "./client-form";
import { ClientInvitation } from "./client-invitation";

const date = (value: number) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Algiers" }).format(value);
const accessLabel = { none: "Non créé", pending: "À finaliser", active: "Autorisé", disabled: "Désactivé" };

export function ClientProfileView({ details }: { details: ClientDetails }) {
  const { profile, access } = details;
  const initials = profile.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();
  const base = `/crm/clientes/${profile.id}`;
  return <div className="space-y-6">
    <nav aria-label="Fil d’Ariane" className="flex items-center gap-3 text-xs text-[#827663] dark:text-[#b9ac98]">
      <Link href="/crm/clientes" className="inline-flex items-center gap-2 transition hover:text-[#a77b37]"><ArrowLeft size={14} />Toutes les clientes</Link>
      <span aria-hidden="true">/</span><span className="text-[#332c21] dark:text-[#eee2cf]">Fiche cliente</span>
    </nav>

    <header className="relative overflow-hidden rounded-3xl border border-[#b7893b]/30 bg-[#201f1a] p-6 text-[#fff8eb] sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border border-[#d1ae6c]/15" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-20 h-56 w-56 rounded-full border border-[#d1ae6c]/15" />
      <p className="relative mb-6 text-[10px] font-medium uppercase tracking-[0.25em] text-[#d8b97f]">Le studio · Relation cliente</p>
      <div className="relative flex flex-wrap items-center gap-5">
        <span aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-[#d8b97f]/30 bg-[#d8b97f]/10 font-serif text-3xl text-[#e9cd98]">{initials}</span>
        <div className="min-w-0 flex-1 basis-48"><h1 className="break-words font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl">{profile.name}</h1><p className="mt-3 flex items-center gap-2 text-xs text-[#c6bcab]"><CalendarDays size={14} />Cliente depuis le {date(profile.createdAt)}</p></div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs ${profile.status === "active" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-white/15 bg-white/5 text-[#c6bcab]"}`}><span className={`h-1.5 w-1.5 rounded-full ${profile.status === "active" ? "bg-emerald-300" : "bg-stone-400"}`} />Fiche {profile.status === "active" ? "active" : "inactive"}</span>
      </div>
      <div className="relative mt-7 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5 text-sm text-[#ded4c3]">
        <p className="flex min-w-0 items-center gap-2.5"><Mail size={15} className="shrink-0 text-[#d8b97f]" /><span className="break-all">{profile.email}</span></p>
        <p className="flex items-center gap-2.5"><Phone size={15} className="text-[#d8b97f]" />{profile.phone || "Téléphone à compléter"}</p>
      </div>
    </header>

    <nav aria-label="Parcours de la cliente" className="grid gap-3 lg:grid-cols-3">
      {[{ href: `${base}/forfaits`, title: "Forfaits & crédits", description: "Abonnements, séances et paiements", icon: WalletCards }, { href: `${base}/historique`, title: "Historique & assiduité", description: "Réservations et présence aux séances", icon: History }, { href: `${base}/mensurations`, title: "Mensurations", description: "Relevés datés et évolution", icon: Ruler }].map(item => <Link key={item.href} href={item.href} className="group flex items-center gap-4 rounded-2xl border border-[#e3dbce] bg-[#fffdf9] p-5 transition hover:border-[#b7893b] hover:shadow-sm dark:border-white/10 dark:bg-[#191713] dark:hover:border-[#b7893b]">
        <span className="rounded-xl bg-[#b7893b]/10 p-3 text-[#a77b37] dark:text-[#dbb97e]"><item.icon size={20} strokeWidth={1.5} /></span><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">{item.title}</h2><p className="mt-1 text-xs text-[#847969] dark:text-[#b4a898]">{item.description}</p></div><ArrowUpRight size={17} className="shrink-0 text-[#a77b37] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>)}
    </nav>

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <ClientForm key={profile.id} profile={profile} />
      <aside aria-label="Suivi et accès de la cliente" className="space-y-5">
        <section className="rounded-2xl border border-[#e3dbce] bg-[#fffdf9] p-5 dark:border-white/10 dark:bg-[#191713]">
          <h2 className="mb-5 flex items-center gap-2 font-serif text-xl"><UserRound size={17} className="text-[#a77b37]" />Repères de la fiche</h2>
          <dl className="space-y-4 text-xs">
            <div className="flex items-center justify-between gap-4"><dt className="text-[#847969] dark:text-[#b4a898]">Création</dt><dd className="text-right">{date(profile.createdAt)}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-[#847969] dark:text-[#b4a898]">Dernière modification</dt><dd className="text-right">{date(profile.updatedAt)}</dd></div>
            <div className="flex items-center justify-between gap-4 border-t border-[#b7893b]/15 pt-4"><dt className="flex items-center gap-1.5 text-[#847969] dark:text-[#b4a898]"><ShieldCheck size={14} />Accès au centre</dt><dd className="font-medium">{accessLabel[access]}</dd></div>
          </dl>
        </section>
        <ClientInvitation details={details} />
      </aside>
    </div>
    <p className="text-center text-[11px] text-[#847969] dark:text-[#b4a898]">Informations privées · Réservées à l’équipe autorisée du centre</p>
  </div>;
}
