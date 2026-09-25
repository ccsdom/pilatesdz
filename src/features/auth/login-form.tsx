"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { inMemoryPersistence, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase/client";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import s from "./login-form.module.css";



export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    } catch (err) {
      console.error("Login attempt failed:", err);
      const code = err && typeof err === "object" && "code" in err ? err.code : "";
      const message = err instanceof Error ? err.message : "";
      if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        setError("Identifiants incorrects. Veuillez vérifier l'adresse e-mail et le mot de passe.");
      } else if (code === "auth/network-request-failed" || message.includes("fetch")) {
        setError("Le service d'authentification est indisponible ou non démarré (émulateur local).");
      } else {
        setError(message || "Connexion impossible. Vérifiez vos identifiants ou réessayez plus tard.");
      }
    } finally {
      // Server cookie owns the session; no refresh token is kept in browser storage.
      if (auth) await signOut(auth).catch(() => {});
      setBusy(false);
    }
  }
  return <form onSubmit={submit} className={s.form} aria-label="Connexion" aria-busy={busy}>
    <div><label htmlFor="email">Adresse e-mail</label><input id="email" name="email" type="email" autoComplete="username" placeholder="vous@exemple.com" required maxLength={254} disabled={busy}/></div>
    <div><div className={s.passwordLabel}><label htmlFor="password">Mot de passe</label><Link href="/connexion/mot-de-passe">Mot de passe oublié ?</Link></div><div className={s.password}><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required maxLength={128} disabled={busy}/><button type="button" disabled={busy} onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>
    {error && <p role="alert" className={s.error}>{error}</p>}
    <button type="submit" className={s.submit} disabled={busy}><span>{busy ? "Connexion en cours…" : "Me connecter"}</span>{busy ? <Loader2 size={17} className={s.spinner}/> : <ArrowRight size={17}/>}</button>
  </form>;
}
