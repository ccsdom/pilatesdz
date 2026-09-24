import Link from "next/link";
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
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-sm text-[#957035]">Gestion des séances et assiduité</p>
          <h1 className="font-serif text-5xl">Réservations</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/crm/planning"
            className="rounded-xl bg-[#111] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[#222] transition-all"
          >
            Ouvrir le Planning
          </Link>
        </div>
      </header>

      <CrmReservationsView
        initialError={loadError}
        initialItems={data.items}
        initialCursor={data.nextCursor}
      />
    </ClientShell>
  );
}
