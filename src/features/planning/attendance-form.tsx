"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { attendanceLabels, type Attendance, type AttendanceStatus, type AttendanceEvent } from "@/domain/models/attendance";
import { STUDIO_TIME_ZONE } from "@/domain/models/planning";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AttendanceForm({ id, clientId, name, attendance, editable }: { id: string; clientId: string; name: string; attendance: Attendance; editable: boolean }) {
  const router = useRouter();
  const request = useRef<{ key: string; id: string } | null>(null);
  const [status, setStatus] = useState<AttendanceStatus>(attendance.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<AttendanceEvent[] | null>(null);
  const [next, setNext] = useState<number | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "").trim();
    const key = JSON.stringify({ status, reason, version: attendance.version });
    if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/presences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, clientId, version: attendance.version, requestId: request.current.id, status, reason }) });
      const result = await response.json();
      if (!response.ok) setError(result.error || "Pointage impossible.");
      else router.refresh();
    } catch { setError("Pointage non confirmé. Actualisez la séance ou réessayez avec les mêmes informations."); }
    finally { setBusy(false); }
  }
  async function history(before?: number) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const query = new URLSearchParams({ id, clientId, ...(before ? { before: String(before) } : {}) });
      const response = await fetch(`/api/presences?${query}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Historique indisponible."); return; }
      setEvents(result.events); setNext(result.next);
    } catch { setError("Historique temporairement indisponible."); }
    finally { setBusy(false); }
  }
  return <div className="w-full space-y-4"><p className="text-sm font-medium" role="status">Présence : {attendanceLabels[attendance.status]}</p>{editable && <form onSubmit={submit} className="flex flex-wrap items-end gap-3"><div className="space-y-2"><label htmlFor={`attendance-${clientId}`} className="block text-sm">Statut de {name}</label><select id={`attendance-${clientId}`} value={status} onChange={(event) => setStatus(event.target.value as AttendanceStatus)} disabled={busy} className="h-10 rounded-lg border bg-white px-3 text-sm">{Object.entries(attendanceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>{attendance.version > 0 && <div className="min-w-0 flex-1 basis-60 space-y-2"><label htmlFor={`reason-${clientId}`} className="block text-sm">Motif de correction pour {name}</label><Input id={`reason-${clientId}`} name="reason" minLength={5} maxLength={300} required disabled={busy} placeholder="Ex. Présence confirmée par la coach" /></div>}<Button type="submit" disabled={busy || status === attendance.status}>Enregistrer pour {name}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => router.refresh()}>Actualiser</Button></form>}{attendance.version > 0 && <Button variant="outline" disabled={busy} onClick={() => history()}>Historique de {name}</Button>}{events && <section aria-label={`Historique de ${name}`} className="space-y-3 rounded-xl bg-[#f3eee5] p-4"><h3 className="font-medium">Historique des pointages</h3>{events.length === 0 && <p>Aucune modification enregistrée.</p>}<ol className="space-y-3">{events.map((event) => <li key={event.id} className="space-y-1 border-b border-[#ded4c3] pb-3 text-sm"><p>{attendanceLabels[event.from]} → {attendanceLabels[event.to]}</p><p>{new Intl.DateTimeFormat("fr-FR", { timeZone: STUDIO_TIME_ZONE, dateStyle: "medium", timeStyle: "short" }).format(event.at)} · Heure d’Alger</p><p className="break-all text-xs text-muted-foreground">Compte administrateur : {event.actorUid}</p>{event.reason && <p className="break-words">{event.reason}</p>}</li>)}</ol>{next && <Button variant="outline" disabled={busy} onClick={() => history(next)}>Modifications plus anciennes</Button>}</section>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}
