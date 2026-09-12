import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { PasswordForm } from "@/features/auth/password-form";

export const metadata = { title: "Mot de passe — Pilates Center Alger", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() {
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12"><BrandLockup /><h1 className="font-serif text-4xl">Votre mot de passe</h1><PasswordForm /><Link href="/connexion" className="text-sm underline">Retour à la connexion</Link></main>;
}
