import { getPageAccess } from "@/lib/auth/page-access";
import { AccessErrorView } from "@/features/auth/access-error";
import { ClientShell } from "@/features/clients/client-shell";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { getOpeningSettings } from "@/repositories/firestore/opening-settings";
import { OpeningSettings } from "@/features/planning/opening-settings";
import { firstBookingDay } from "@/domain/models/public-booking-calendar";
import { getRequestTime } from "@/lib/request-time";
export const dynamic = "force-dynamic";
export const metadata = { title: "Horaires du centre", robots: { index: false, follow: false } };
export default async function Page() {
  const result = await getPageAccess(["admin", "manager"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  let policy;
  try {
    policy = await getOpeningSettings(getFirebaseAdmin().firestore, result.access);
  } catch { return <AccessErrorView message="Paramètres d’ouverture temporairement indisponibles." />; }
  return <ClientShell centerId={result.access.centerId} active="opening"><OpeningSettings initial={policy} minimum={firstBookingDay(getRequestTime())} /></ClientShell>;
}
