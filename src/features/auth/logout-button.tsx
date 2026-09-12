"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function logout() {
    setBusy(true); setError(false);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error("Logout failed");
      // Full navigation also discards private content in the router cache.
      window.location.replace("/connexion");
    } catch { setError(true); setBusy(false); }
  }
  return <div><Button variant="outline" disabled={busy} onClick={logout}>{busy ? "Déconnexion…" : "Se déconnecter"}</Button>{error && <p role="alert" className="mt-2 text-sm text-destructive">Déconnexion indisponible. Réessayez.</p>}</div>;
}
