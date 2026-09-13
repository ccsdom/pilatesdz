import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getClientHistoryService } from "@/lib/client-history/server";
import { getRequestTime } from "@/lib/request-time";
import { studioDay } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { LogoutButton } from "@/features/auth/logout-button";
import { AccessErrorView } from "@/features/auth/access-error";
import { ClientHistory } from "@/features/planning/client-history";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Mes séances — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string; after?: string }> }) {
  const result = await getPageAccess(["client"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const query = await searchParams;
  const month = typeof query.month === "string" ? query.month : studioDay(getRequestTime()).slice(0, 7);
  const after = typeof query.after === "string" ? query.after : undefined;
  let page;
  try { page = await getClientHistoryService().list(result.access, month, undefined, after); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Historique temporairement indisponible."} />; }
  return <main className="mx-auto min-h-screen max-w-6xl space-y-8 px-5 py-8"><header className="flex flex-wrap items-center justify-between gap-5"><BrandLockup /><LogoutButton /></header><Link href="/espace-cliente" className="block text-sm underline">Retour au planning</Link><h1 className="font-serif text-4xl">Mes séances et mon assiduité</h1><ClientHistory page={page} basePath="/espace-cliente/historique" admin={false} after={after} /></main>;
}
