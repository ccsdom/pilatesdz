"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientDetails } from "@/domain/models/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUpRight, KeyRound, Loader2, Mail } from "lucide-react";

export function ClientInvitation({ details }: { details: ClientDetails }) {
  const cloud = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === "false";
  const [emailAccepted, setEmailAccepted] = useState(false);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  async function invite() {
    if (busy) return; setBusy(true); setError(""); setLink(""); setEmailAccepted(false);
    try {
      const response = await fetch("/api/crm/clientes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "invite", id: details.profile.id }) });
      const result = await response.json();
      if (!response.ok) setError(result.error || "Invitation indisponible. Vous pouvez reprendre depuis cette fiche.");
      else { setLink(cloud ? "" : result.invitationUrl ?? ""); setEmailAccepted(result.emailAccepted === true); }
      router.refresh();
    } catch { setError("Invitation non confirmée. Rechargez la fiche avant de réessayer."); }
    finally { setBusy(false); }
  }
  const status = { none: "Aucun compte de connexion", pending: "Invitation à reprendre", active: "Accès autorisé au centre", disabled: "Accès désactivé au centre" }[details.access];
  return <section className="space-y-4 rounded-2xl border border-[#b7893b]/25 bg-[#ede3d0]/40 p-5 dark:bg-[#b7893b]/5"><div className="flex items-center gap-2.5"><KeyRound size={18} className="text-[#a77b37]" /><h2 className="font-serif text-xl">Espace cliente</h2></div><p className="inline-flex rounded-lg bg-[#fffdf9] px-3 py-2 text-xs font-medium dark:bg-white/5">{status}</p><p className="text-xs leading-6 text-[#847969] dark:text-[#b4a898]">{cloud ? "La cliente reçoit à son adresse enregistrée un e-mail pour choisir son mot de passe et accéder à son espace personnel." : "Démonstration locale : aucun e-mail réel n’est envoyé. L’invitation utilise les coordonnées enregistrées dans cette fiche."}</p>
    {details.access !== "disabled" && details.profile.status === "active" && <Button type="button" variant="outline" onClick={invite} disabled={busy} className="h-auto min-h-11 w-full whitespace-normal rounded-xl text-xs">{busy ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}{busy ? "Préparation…" : cloud ? "Envoyer l’e-mail d’accès" : details.access === "active" ? "Préparer un nouveau lien" : "Inviter à l’espace cliente"}</Button>}
    {details.profile.status === "inactive" && <p className="text-sm text-muted-foreground">Réactivez la fiche pour préparer une invitation.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {emailAccepted && <p role="status">Demande d’envoi acceptée par Firebase. La cliente doit consulter sa boîte e-mail et ses courriers indésirables.</p>}
    {link && <div className="space-y-3 rounded-xl border border-[#d5ae65] p-4"><p role="status" className="text-sm">Le lien de test est prêt.</p><a href={link} className="block text-sm underline" rel="noreferrer">Ouvrir le lien de test</a><Label htmlFor="profile-invitation">Lien local à copier</Label><Input id="profile-invitation" value={link} readOnly onFocus={(event) => event.target.select()} /></div>}
    <Link href="/crm/acces" className="flex items-center justify-between gap-2 border-t border-[#b7893b]/20 pt-4 text-xs text-[#89632c] hover:underline dark:text-[#dbb97e]">Gérer les accès et les désactivations<ArrowUpRight size={14} className="shrink-0" /></Link>
  </section>;
}
