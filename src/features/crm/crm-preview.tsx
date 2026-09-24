import type { ReactNode } from "react";
import { CalendarDays, CircleUserRound, Search, UsersRound, WalletCards } from "lucide-react";

import type { DaySummary } from "@/domain/models/dashboard";
import Link from "next/link";



export function CrmPreview({ dayLabel, summary, attendance, analytics, canManageAccess }: { canManageAccess: boolean; attendance: ReactNode; analytics: ReactNode; summary: DaySummary; dayLabel: string }) {
  const stats = [
    { icon: CalendarDays, value: summary.sessions, label: "Séances maintenues", note: `${summary.cancelled} séance(s) annulée(s) exclue(s)`, key: "sessions" },
    { icon: UsersRound, value: summary.bookings, label: "Réservations du jour", note: "Places réservées, pas clientes uniques", key: "bookings" },
    { icon: WalletCards, value: summary.available, label: "Places non réservées", note: "Sur les séances maintenues du jour", key: "available" },
    { icon: CalendarDays, value: summary.occupancy === null ? "—" : `${summary.occupancy} %`, label: "Taux de remplissage", note: "Réservations / capacité du jour", key: "occupancy" },
  ];
  return <div><header className="flex h-[78px] items-center justify-between border-b border-[#d9cdb9] bg-[#fbf8f2] dark:bg-[#181613] dark:border-[#332e26] px-4 sm:px-7"><div className="flex items-center gap-3"><div><p className="text-xs uppercase tracking-[.18em] text-[#957035]">{dayLabel}</p><h1 className="mt-1 text-xl font-semibold">Bonjour</h1></div></div><div className="flex items-center gap-3"><Link href="/crm/clientes" className="hidden items-center gap-2 rounded-full border border-[#d9cdb9] bg-white px-4 py-2.5 text-sm text-[#6b645a] sm:flex"><Search className="h-4 w-4"/> Rechercher une cliente</Link>{canManageAccess && <Link href="/crm/acces" aria-label="Gestion des accès"><CircleUserRound className="h-9 w-9 text-[#9d7837]"/></Link>}</div></header>
      <div className="mt-7 space-y-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-[#746d63] dark:text-[#b7a993]">Journée complète, séances passées et à venir. Actualisez la page pour mettre à jour les chiffres.</p><h2 className="mt-1 font-serif text-4xl">Tableau de bord</h2></div><Link href="/crm/planning" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111] px-5 py-3 text-sm font-semibold text-white"><CalendarDays className="h-4 w-4 text-[#d5ae65]"/> Gérer les séances</Link></div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({icon:Icon,value,label,note,key})=><article key={label} className="rounded-2xl border border-[#ded4c3] bg-[#fffdf9] dark:border-[#332e26] dark:bg-[#181613] p-5 shadow-[0_10px_35px_rgba(72,54,26,.05)]"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ede0c8] text-[#8d6729]"><Icon className="h-5 w-5"/></span></div><p data-testid={`dashboard-${key}`} className="mt-6 text-2xl font-semibold">{value}</p><p className="mt-1 text-sm text-[#6f685e] dark:text-[#b7a993]">{label}</p><p className="mt-4 text-xs font-medium text-[#98702e] dark:text-[#d5ae65]">{note}</p></article>)}</section>
      {analytics}
      {attendance}
      </div></div>;
}
