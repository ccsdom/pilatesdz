import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { LoginForm } from "@/features/auth/login-form";

export const metadata = { title: "Connexion — Pilates Center Alger", robots: { index: false, follow: false } };

export default function Page() {
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12"><BrandLockup /><div><p className="mb-3 text-sm text-muted-foreground">Bienvenue au studio</p><h1 className="font-serif text-5xl">Connexion</h1></div><LoginForm /><Link href="/" className="text-sm underline">Retour au studio</Link></main>;
}
