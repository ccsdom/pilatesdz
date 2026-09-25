import Link from "next/link";
import { CalendarDays, ArrowUpRight } from "lucide-react";
import styles from "@/features/crm/reservations.module.css";
import { getPageAccess } from "@/lib/auth/page-access";
import { getPlanningService } from "@/lib/planning/server";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { CrmReservationsView } from "@/features/crm/crm-reservations-view";
import type { ReservationsPage } from "@/domain/models/planning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Réservations — Pilates Center Alger",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const result = await getPageAccess(["admin", "manager"]);
  if (!result.access) return <AccessErrorView message={result.error} />;

  let data: ReservationsPage = { items: [], nextCursor: null };
  let loadError: string | null = null;

  try {
    data = await getPlanningService().listReservations(result.access, undefined, 20);
  } catch (error) {
    console.error("Erreur chargement réservations CRM:", error);
    loadError = "Réservations temporairement indisponibles. Actualisez la page pour réessayer.";
  }

  return (
    <ClientShell centerId={result.access.centerId} active="reservations">
      <header className={styles.hero}>
        <div><p className={styles.eyebrow}>PILATES DZ · Réservations</p><h1>Chaque rendez-vous<br /><em>compte.</em></h1><p className={styles.intro}>Retrouvez les réservations de vos clientes et suivez leur présence, en toute clarté.</p></div>
        <Link href="/crm/planning" className={styles.planningLink}><CalendarDays size={18} aria-hidden="true" />Ouvrir le planning<ArrowUpRight size={17} aria-hidden="true" /></Link>
      </header>

      <CrmReservationsView
        initialError={loadError}
        initialItems={data.items}
        initialCursor={data.nextCursor}
      />
    </ClientShell>
  );
}
