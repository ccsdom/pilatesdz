import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { getPageAccess } from "@/lib/auth/page-access";
import { AccessErrorView } from "@/features/auth/access-error";
import { LogoutButton } from "@/features/auth/logout-button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { title: "Espace cliente — Pilates Center Alger", robots: { index: false, follow: false } };

export default async function Page() {
  const result = await getPageAccess(["client"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 px-6"><BrandLockup /><h1 className="font-serif text-5xl">Votre espace</h1><p>Vous êtes connectée. Les réservations et le suivi de vos séances seront disponibles prochainement.</p><LogoutButton /><Link href="/" className="underline">Retour au studio</Link></main>;
}
