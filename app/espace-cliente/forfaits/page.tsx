import { getSubscriptionService } from "@/lib/packages/subscriptions";
import { SubscriptionList } from "@/features/packages/subscription-list";
import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getPackageService } from "@/lib/packages/server";
import { getRequestTime } from "@/lib/request-time";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { LogoutButton } from "@/features/auth/logout-button";
import { AccessErrorView } from "@/features/auth/access-error";
import { PackageList } from "@/features/packages/package-list";
import { ManagementError } from "@/domain/ports/access-management";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Mes forfaits — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ after?: string; subscriptionAfter?: string }> }) {
  const result = await getPageAccess(["client"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const query = await searchParams;
  const subscriptionAfter = typeof query.subscriptionAfter === "string" ? query.subscriptionAfter : undefined;
  const after = typeof query.after === "string" ? query.after : undefined;
  let page, subscriptions;
  try { [page, subscriptions] = await Promise.all([getPackageService().list(result.access, undefined, after), getSubscriptionService().list(result.access, undefined, subscriptionAfter)]); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Forfaits temporairement indisponibles."} />; }
  return <main className="mx-auto min-h-screen max-w-6xl space-y-8 px-5 py-8"><header className="flex flex-wrap items-center justify-between gap-5"><BrandLockup /><LogoutButton /></header><Link href="/espace-cliente" className="block text-sm underline">Retour au planning</Link><h1 className="font-serif text-4xl">Mes forfaits et crédits</h1><p>Un crédit est consommé à la réservation et restitué en cas d’annulation avant le cours. La date d’expiration du forfait reste inchangée.</p><SubscriptionList page={subscriptions} now={getRequestTime()} after={subscriptionAfter} packageAfter={after} basePath="/espace-cliente/forfaits" /><PackageList subscriptionAfter={subscriptionAfter} page={page} now={getRequestTime()} after={after} basePath="/espace-cliente/forfaits" /></main>;
}
