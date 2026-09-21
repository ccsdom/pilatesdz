import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { personalMeasurements } from "@/lib/clients/personal-measurements";
import { AccessErrorView } from "@/features/auth/access-error";
import { PersonalMeasurements } from "@/features/clients/personal-measurements";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { LogoutButton } from "@/features/auth/logout-button";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Mes mensurations — Pilates Center Alger", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function Page() {
  const result = await getPageAccess(["client"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  let initial;
  try { initial = await personalMeasurements(result.access); }
  catch { return <AccessErrorView message="Vos mensurations sont temporairement indisponibles." />; }
  return <main className="mx-auto min-h-screen max-w-6xl space-y-7 px-5 py-8"><header className="flex flex-wrap items-center justify-between gap-4"><BrandLockup /><LogoutButton /></header><Link href="/espace-cliente" className="text-sm underline">Retour à mon espace</Link><div><h1 className="font-serif text-4xl">Mes mensurations</h1><p className="mt-3 text-sm text-muted-foreground">Retrouvez les relevés du studio et suivez votre évolution à votre rythme.</p></div><PersonalMeasurements initial={initial} /></main>;
}
