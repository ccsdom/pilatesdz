"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  UsersRound,
  UserCheck,
  UserX,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Plus,
  Loader2,
  Eye,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { COURSE_MAX_CAPACITY } from "@/domain/models/studio-offers";
import { Button } from "@/components/ui/button";
import { sessionPhase, studioDateTime, type SessionDetails, type PilatesSession, type ReservationRecord } from "@/domain/models/planning";
import { usePlanningTime } from "./use-planning-time";

interface SessionPreviewModalProps {
  sessionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: PilatesSession | ReservationRecord | null;
}

export function SessionPreviewModal(props: SessionPreviewModalProps) {
  return props.open && props.sessionId ? <LoadedSessionPreview key={props.sessionId} {...props} /> : null;
}

function LoadedSessionPreview({
  sessionId,
  open,
  onOpenChange,
  initialData,
}: SessionPreviewModalProps) {
  const [details, setDetails] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/planning/${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Impossible de charger les détails de la séance.");
        return res.json();
      })
      .then((data: SessionDetails) => {
        if (isMounted) {
          setDetails(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Erreur de chargement");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId, open]);

  // Derived session info (fallback to initialData while loading)
  const session = details?.session || (initialData ? {
    id: "sessionId" in initialData ? initialData.sessionId : initialData.id,
    title: "sessionTitle" in initialData ? initialData.sessionTitle : initialData.title,
    instructor: initialData.instructor,
    startsAt: initialData.startsAt,
    durationMinutes: initialData.durationMinutes,
    capacity: "capacity" in initialData ? initialData.capacity : COURSE_MAX_CAPACITY,
    bookedCount: "bookedCount" in initialData ? initialData.bookedCount : 0,
    status: "status" in initialData ? initialData.status : initialData.sessionStatus,
    centerId: "centerId" in initialData ? initialData.centerId : "",
  } : null);

  const attendees = details?.attendees || [];
  const fillPercent = session ? Math.min(100, Math.round((session.bookedCount / session.capacity) * 100)) : 0;
  const availableSeats = session ? session.capacity - session.bookedCount : 0;
  const isCancelled = session?.status === "cancelled";
  const [initialTime] = useState(Date.now);
  const now = usePlanningTime(initialTime);
  const hasStarted = session ? session.startsAt <= now : false;
  const phase = session ? sessionPhase(session, now) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-w-2xl rounded-3xl border border-[#ded4c3] bg-[#fffdf9] p-6 sm:p-8 shadow-2xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4ece0] px-3 py-1 text-xs font-bold text-[#765522]">
              <Eye size={14} /> Aperçu rapide de la séance
            </span>

            {session && (
              isCancelled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3.5 py-1 text-xs font-bold text-rose-800">
                  <XCircle size={14} /> Séance annulée
                </span>
              ) : phase === "ended" || phase === "ongoing" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eee5d8] px-3.5 py-1 text-xs font-medium text-[#736857]">
                  {phase === "ongoing" ? "Séance en cours" : "Séance terminée"}
                </span>
              ) : availableSeats === 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold text-amber-800">
                  <AlertCircle size={14} /> Séance complète
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                  <CheckCircle2 size={14} /> {availableSeats} place(s) disponible(s)
                </span>
              )
            )}
          </div>

          <DialogTitle className="font-serif text-3xl font-medium text-[#111]">
            {session ? session.title : "Chargement de la séance..."}
          </DialogTitle>

          {session && (
            <DialogDescription className="text-xs text-[#786c5c] font-medium flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 font-bold text-[#8b652b]">
                <Calendar size={14} /> {studioDateTime(session.startsAt).slice(0, 10)} à {studioDateTime(session.startsAt).slice(11)} (Alger)
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock size={14} /> {session.durationMinutes} minutes
              </span>
              <span>·</span>
              <span className="font-medium text-[#111]">Coach {session.instructor}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Content Body */}
        <div className="space-y-6 py-3">
          {session && (
            <>
              {/* Occupation Progress Card */}
              <div className="rounded-2xl bg-[#fcf8f1] p-4 border border-[#eee4d5] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-[#6e6252]">
                    <UsersRound size={15} className="text-[#b7893b]" /> Réservations & Capacité
                  </span>
                  <span className="font-bold text-[#111]">
                    {session.bookedCount} / {session.capacity} places occupées ({fillPercent}%)
                  </span>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#eee6d8]">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isCancelled
                        ? "bg-rose-400"
                        : fillPercent >= 100
                        ? "bg-amber-600"
                        : "bg-[#b7893b]"
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </div>

              {/* Registered Clients / Attendees Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-lg font-medium text-[#111]">
                    Participantes inscrites ({attendees.length})
                  </h4>
                  {loading && (
                    <span className="flex items-center gap-1.5 text-xs text-[#8b652b]">
                      <Loader2 size={13} className="animate-spin" /> Actualisation...
                    </span>
                  )}
                </div>

                {error ? (
                  <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                    {error}
                  </p>
                ) : attendees.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#ded4c3] bg-white p-6 text-center text-xs text-[#786c5c]">
                    {loading ? "Chargement des inscrites..." : "Aucune participante inscrite pour cette séance."}
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {attendees.map((client) => {
                      const status = client.attendance?.status || "unmarked";
                      return (
                        <div
                          key={client.clientId}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[#efe6d8] bg-white p-3 hover:border-[#b7893b] transition-all"
                        >
                          <Link
                            href={`/crm/clientes/${client.clientId}`}
                            onClick={() => onOpenChange(false)}
                            className="flex items-center gap-2.5 text-sm font-semibold text-[#111] hover:text-[#b7893b] transition-colors"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ede0c8] text-xs font-bold text-[#765522]">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                            <span>{client.name}</span>
                            <ExternalLink size={13} className="text-[#998c7b] opacity-70" />
                          </Link>

                          {status === "present" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              <UserCheck size={12} /> Présente
                            </span>
                          ) : status === "absent" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              <UserX size={12} /> Absente
                            </span>
                          ) : (
                            <span className="text-xs text-[#887c6c] italic">
                              À renseigner
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {session && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#eee5d8]">
            <div className="flex flex-wrap items-center gap-2">
              {!isCancelled && !hasStarted && session.bookedCount < session.capacity && (
                <Link
                  href={`/crm/planning/${session.id}/inscrire`}
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#111] hover:bg-[#222] px-4 py-2 text-xs font-semibold text-white transition-all"
                >
                  <Plus size={14} className="text-[#d5ae65]" />
                  <span>Inscrire une cliente</span>
                </Link>
              )}

              <Link
                href={`/crm/planning/${session.id}`}
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#b7893b] bg-[#fffdf9] hover:bg-[#fbf7ef] px-4 py-2 text-xs font-semibold text-[#8d6729] transition-all"
              >
                <span>Gérer la séance & Feuille d&apos;émargement</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-[#dcd1be] text-xs font-medium"
            >
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
