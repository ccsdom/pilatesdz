import type { ReactNode } from "react";
import { ArrowUpRight, CalendarDays, CircleUserRound, Search, UsersRound, WalletCards } from "lucide-react";

import type { DaySummary } from "@/domain/models/dashboard";
import Link from "next/link";
import styles from "./dashboard.module.css";



export function CrmPreview({ dayLabel, summary, attendance, analytics, canManageAccess }: { canManageAccess: boolean; attendance: ReactNode; analytics: ReactNode; summary: DaySummary; dayLabel: string }) {
  const stats = [
    { icon: CalendarDays, value: summary.sessions, label: "Séances maintenues", note: `${summary.cancelled} séance(s) annulée(s) exclue(s)`, key: "sessions" },
    { icon: UsersRound, value: summary.bookings, label: "Réservations du jour", note: "Places réservées, pas clientes uniques", key: "bookings" },
    { icon: WalletCards, value: summary.available, label: "Places non réservées", note: "Sur les séances maintenues du jour", key: "available" },
    { icon: CalendarDays, value: summary.occupancy === null ? "—" : `${summary.occupancy} %`, label: "Taux de remplissage", note: "Réservations / capacité du jour", key: "occupancy" },
  ];
  return <div className={styles.dashboard}>
    <header className={styles.hero}>
      <div className={styles.heroTop}><p className={styles.eyebrow}>PILATES DZ · Gestion du centre</p><span className={styles.date}><CalendarDays size={14} aria-hidden="true" />{dayLabel}</span></div>
      <div className={styles.heroBody}>
        <div><p className={styles.welcome}>Bonjour,</p><h1>Votre centre,<br /><em>en un regard.</em></h1><p className={styles.intro}>Une vision claire de votre activité, pour garder toute votre attention sur l’essentiel.</p></div>
        <div className={styles.heroActions}><Link href="/crm/planning" className={styles.primary}><CalendarDays size={17} aria-hidden="true" />Gérer les séances<ArrowUpRight size={17} aria-hidden="true" /></Link><Link href="/crm/clientes" className={styles.search}><Search size={16} aria-hidden="true" />Rechercher une cliente</Link>{canManageAccess && <Link href="/crm/acces" className={styles.access}><CircleUserRound size={15} aria-hidden="true" />Gestion des accès</Link>}</div>
      </div>
    </header>
    <section aria-labelledby="dashboard-today">
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>01 — Aujourd’hui</p><h2 id="dashboard-today">Le rythme du jour</h2></div><p className={styles.caption}>Journée complète, séances passées et à venir.<br />Actualisez la page pour mettre à jour les chiffres.</p></div>
      <div className={styles.stats}>{stats.map(({icon:Icon,value,label,note,key})=><article key={label} className={styles.stat}><div className={styles.statTop}><p>{label}</p><Icon size={19} aria-hidden="true" /></div><p data-testid={"dashboard-" + key} className={styles.value}>{value}</p><p className={styles.note}>{note}</p></article>)}</div>
    </section>
    <section aria-labelledby="dashboard-followup"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>02 — Suivi du centre</p><h2 id="dashboard-followup">L’attention aux détails</h2></div></div><div className={styles.followup}>{attendance}</div></section>
    <div className={styles.analytics}>{analytics}</div>
  </div>;
}
