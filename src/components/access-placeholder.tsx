import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";

export function AccessPlaceholder({ title }: { title: string }) {
  return <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-8 px-6"><BrandLockup /><h1 className="font-serif text-5xl">{title}</h1><p className="text-muted-foreground">Cet espace est en préparation. La connexion et les services en ligne ne sont pas encore disponibles.</p><Link href="/" className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Retour au studio</Link></main>;
}
