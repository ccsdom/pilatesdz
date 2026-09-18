import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { getPageAccess } from "@/lib/auth/page-access";
import { AccessErrorView } from "@/features/auth/access-error";
import { LogoutButton } from "@/features/auth/logout-button";
import { getPlanningService } from "@/lib/planning/server";
import { studioDay } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import { PlanningCalendar } from "@/features/planning/planning-calendar";
import { getRequestTime } from "@/lib/request-time";
import { WalletCards, History } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { title: "Espace cliente — Pilates Center Alger", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ day?: string; after?: string }> }) {
  const result = await getPageAccess(["client"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const params = await searchParams;
  const now = getRequestTime();
  let page;
  try { page = await getPlanningService().list(result.access, typeof params.day === "string" ? params.day : studioDay(now), typeof params.after === "string" ? params.after : undefined); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Planning temporairement indisponible."} />; }
  return <main className="mx-auto min-h-screen max-w-6xl space-y-8 px-5 py-8 sm:px-8"><header className="flex flex-wrap items-center justify-between gap-5"><BrandLockup /><LogoutButton /></header><div className="space-y-3"><h1 className="font-serif text-4xl sm:text-5xl">Votre espace</h1><p>Choisissez votre séance et réservez votre place.</p><p className="text-sm text-muted-foreground">Un crédit par réservation, restitué en cas d’annulation avant le cours. Le forfait doit être valable à la date de la séance.</p></div><div className="flex flex-wrap items-center gap-3"><Link href="/espace-cliente/forfaits" className="inline-flex items-center gap-2 rounded-xl bg-[#b7893b] px-5 py-3 text-sm font-medium text-black"><WalletCards className="h-4 w-4" />Mes forfaits et crédits</Link><Link href="/espace-cliente/historique" className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium"><History className="h-4 w-4" />Mes séances et mon assiduité</Link></div><PlanningCalendar page={page} admin={false} now={now} /><Link href="/" className="block text-sm underline">Retour au studio</Link></main>;
}

