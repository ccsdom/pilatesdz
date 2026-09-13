"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { confirmPasswordReset, sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordForm() {
  const [code, setCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    setCode(params.get("oobCode"));
    // The bearer code stays in memory, never in a server URL or referer.
    window.history.replaceState(null, "", window.location.pathname);
    setReady(true);
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setError("");
    if (code && data.get("password") !== data.get("confirmation")) { setError("Les mots de passe ne correspondent pas."); return; }
    setBusy(true);
    try {
      const auth = getFirebaseClient().auth;
      if (code) await confirmPasswordReset(auth, code, String(data.get("password")));
      else {
        try { await sendPasswordResetEmail(auth, String(data.get("email")).trim()); }
        catch (failure) { if (!["auth/user-not-found", "auth/user-disabled"].includes((failure as { code?: string }).code ?? "")) throw failure; }
      }
      setDone(true);
    } catch { setError(code ? "Ce lien est invalide, expiré ou déjà utilisé. Demandez un nouveau lien." : "Demande indisponible. Réessayez plus tard."); }
    finally { setBusy(false); }
  }
  if (!ready) return <p role="status">Chargement…</p>;
  if (done) return <p role="status">{code ? "Votre mot de passe est enregistré. Vous pouvez vous connecter." : process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === "false" ? "Si cette adresse dispose d’un compte, un e-mail de récupération vous sera envoyé. Vérifiez également vos courriers indésirables." : "Si cette adresse dispose d’un compte, un lien de récupération est disponible. En démonstration locale, aucun e-mail réel n’est envoyé."}</p>;
  return <form onSubmit={submit} className="space-y-5">
    <p className="text-sm text-muted-foreground">{code ? "Choisissez un mot de passe d’au moins 12 caractères pour votre compte." : "Saisissez l’adresse e-mail de votre compte pour demander un lien de récupération."}</p>
    {code ? <><div className="space-y-2"><Label htmlFor="new-password">Nouveau mot de passe</Label><Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={busy} /></div><div className="space-y-2"><Label htmlFor="confirmation">Confirmer le mot de passe</Label><Input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={busy} /></div></> : <div className="space-y-2"><Label htmlFor="recovery-email">Adresse e-mail</Label><Input id="recovery-email" name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} /></div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" className="w-full" disabled={busy}>{busy ? "Traitement en cours…" : code ? "Enregistrer le mot de passe" : "Demander un lien"}</Button>
  </form>;
}
