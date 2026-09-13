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
export default async function Page({ searchParams }: { searchParams: Promise<{ after?: string }> }) {
  const result = await getPageAccess(["client"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const query = await searchParams;
  const after = typeof query.after === "string" ? query.after : undefined;
  let page;
  try { page = await getPackageService().list(result.access, undefined, after); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Forfaits temporairement indisponibles."} />; }
  return <main className="mx-auto min-h-screen max-w-6xl space-y-8 px-5 py-8"><header className="flex flex-wrap items-center justify-between gap-5"><BrandLockup /><LogoutButton /></header><Link href="/espace-cliente" className="block text-sm underline">Retour au planning</Link><h1 className="font-serif text-4xl">Mes forfaits et crédits</h1><p>Un crédit est consommé à la réservation et restitué en cas d’annulation avant le cours. La date d’expiration du forfait reste inchangée.</p><PackageList page={page} now={getRequestTime()} after={after} basePath="/espace-cliente/forfaits" /></main>;
}
