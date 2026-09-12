import Link from "next/link";
import { LogoutButton } from "./logout-button";

export function AccessErrorView({ message }: { message: string }) {
  return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6"><h1 className="font-serif text-4xl">Accès à votre espace</h1><p role="alert">{message}</p><Link href="/" className="underline">Retour au studio</Link><LogoutButton /></main>;
}
