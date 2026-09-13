"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SessionAction({ id, action, clientId, label }: { id: string; action: "book" | "cancel-booking" | "cancel-session"; clientId?: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit() {
    if (busy) return; setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/planning", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id, ...(clientId ? { clientId } : {}) }) });
      const result = await response.json();
      if (!response.ok) setError(result.error || "Opération impossible.");
      else { setMessage(action === "book" ? "Réservation confirmée." : action === "cancel-session" ? "Séance annulée pour toutes les participantes." : "Réservation annulée."); setConfirm(false); }
      router.refresh();
    } catch { setError("Opération non confirmée. Actualisez le planning avant de réessayer."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3">{confirm ? <div className="space-y-3"><p className="text-sm">{action === "cancel-session" ? "Annuler cette séance pour toutes les participantes ?" : "Confirmer l’annulation de cette réservation ?"}</p><div className="flex flex-wrap gap-3"><Button variant="destructive" disabled={busy} onClick={submit}>Confirmer l’annulation</Button><Button variant="outline" disabled={busy} onClick={() => setConfirm(false)}>Conserver</Button></div></div> : <Button variant={action === "book" ? "default" : "outline"} disabled={busy} onClick={() => action === "book" ? submit() : setConfirm(true)}>{busy ? "Traitement…" : label}</Button>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-[#765522]">{message}</p>}</div>;
}
