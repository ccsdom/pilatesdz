"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientDetails } from "@/domain/models/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ClientInvitation({ details }: { details: ClientDetails }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  async function invite() {
    if (busy) return; setBusy(true); setError(""); setLink("");
    try {
      const response = await fetch("/api/crm/clientes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "invite", id: details.profile.id }) });
      const result = await response.json();
      if (!response.ok) setError(result.error || "Invitation indisponible. Vous pouvez reprendre depuis cette fiche.");
      else setLink(result.invitationUrl);
      router.refresh();
    } catch { setError("Invitation non confirmée. Rechargez la fiche avant de réessayer."); }
    finally { setBusy(false); }
  }
  const status = { none: "Aucun compte de connexion", pending: "Invitation à reprendre", active: "Accès autorisé au centre", disabled: "Accès désactivé au centre" }[details.access];
  return <section className="space-y-4 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5 sm:p-7"><h2 className="font-serif text-2xl">Espace cliente</h2><p className="text-sm">{status}</p><p className="text-sm leading-6 text-muted-foreground">Démonstration locale : aucun e-mail réel n’est envoyé. L’invitation utilise les coordonnées enregistrées dans cette fiche.</p>
    {details.access !== "disabled" && details.profile.status === "active" && <Button type="button" variant="outline" onClick={invite} disabled={busy}>{busy ? "Préparation…" : details.access === "active" ? "Préparer un nouveau lien" : "Inviter à l’espace cliente"}</Button>}
    {details.profile.status === "inactive" && <p className="text-sm text-muted-foreground">Réactivez la fiche pour préparer une invitation.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {link && <div className="space-y-3 rounded-xl border border-[#d5ae65] p-4"><p role="status" className="text-sm">Le lien de test est prêt.</p><a href={link} className="block text-sm underline" rel="noreferrer">Ouvrir le lien de test</a><Label htmlFor="profile-invitation">Lien local à copier</Label><Input id="profile-invitation" value={link} readOnly onFocus={(event) => event.target.select()} /></div>}
    <Link href="/crm/acces" className="block text-sm underline">Gérer les accès et les désactivations</Link>
  </section>;
}
