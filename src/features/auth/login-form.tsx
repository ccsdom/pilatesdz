"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { inMemoryPersistence, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    let auth;
    try {
      auth = getFirebaseClient().auth;
      await setPersistence(auth, inMemoryPersistence);
      const credential = await signInWithEmailAndPassword(auth, String(form.get("email")).trim(), String(form.get("password")));
      const response = await fetch("/api/auth/session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: await credential.user.getIdToken() }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Connexion impossible."); return; }
      await signOut(auth);
      router.replace(result.destination === "/crm" ? "/crm" : "/espace-cliente");
      router.refresh();
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      const code = err?.code || "";
      if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        setError("Identifiants incorrects. Veuillez vérifier l'adresse e-mail et le mot de passe.");
      } else if (code === "auth/network-request-failed" || err?.message?.includes("fetch")) {
        setError("Le service d'authentification est indisponible ou non démarré (émulateur local).");
      } else {
        setError(err?.message || "Connexion impossible. Vérifiez vos identifiants ou réessayez plus tard.");
      }
    } finally {
      // Server cookie owns the session; no refresh token is kept in browser storage.
      if (auth) await signOut(auth).catch(() => {});
      setBusy(false);
    }
  }
  return <form onSubmit={submit} className="w-full space-y-5">
    <div className="space-y-2"><Label htmlFor="email">Adresse e-mail</Label><Input id="email" name="email" type="email" autoComplete="username" required maxLength={254} disabled={busy} /></div>
    <div className="space-y-2"><Label htmlFor="password">Mot de passe</Label><Input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} disabled={busy} /></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" className="w-full" disabled={busy}>{busy ? "Connexion en cours…" : "Se connecter"}</Button>
    <Link href="/connexion/mot-de-passe" className="block text-sm underline">Mot de passe oublié ?</Link>
    <p className="text-sm leading-6 text-muted-foreground">Votre accès est créé par le centre. Pour obtenir un compte, contactez l’équipe du studio.</p>
  </form>;
}
