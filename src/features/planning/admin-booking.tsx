"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdminBooking({ sessionId, clientId, name }: { sessionId: string; clientId: string; name: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/planning", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "book-client", id: sessionId, clientId }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Inscription impossible."); return; }
      router.push(`/crm/planning/${sessionId}`); router.refresh();
    } catch { setError("Inscription non confirmée. Vérifiez les participantes de la séance avant de réessayer."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3">{confirm ? <><p className="text-sm">Inscrire {name} ? Un crédit sera débité de son forfait valable à la date du cours. Une inscription déjà confirmée ne sera pas débitée une seconde fois.</p><div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={submit}>{busy ? "Inscription…" : "Confirmer l’inscription"}</Button><Button variant="outline" disabled={busy} onClick={() => setConfirm(false)}>Retour</Button></div></> : <Button onClick={() => setConfirm(true)}>Sélectionner {name}</Button>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}
