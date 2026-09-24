"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SINGLE_SESSION_OFFERS, formatDzd } from "@/domain/models/studio-offers";
import { BookingDatePicker } from "./booking-date-picker";
import { bookingCalendarDate, firstBookingDay, initialBookingDay } from "@/domain/models/public-booking-calendar";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Shield, 
  Check, 
  AlertCircle,
  MapPin,
  Flame,
  Info,
  Loader2,
  KeyRound
} from "lucide-react";

// Types
export type PracticeType = {
  id: string;
  name: string;
  category: string;
  duration: string;
  intensity: string;
  description: string;
  price: string;
  badge?: string;
  iconName: string;
};

export type GenderOption = "femme" | "homme";

export type TimeSlot = {
  time: string;
  totalCapacity: number;
  reserved: number;
  available: number;
  status: "available" | "limited" | "full";
};

const PRACTICES: PracticeType[] = SINGLE_SESSION_OFFERS.map(offer => ({
  id: offer.id,
  name: offer.label,
  category: offer.id === "discovery" ? "Première visite" : "À la séance",
  duration: "60 min",
  intensity: "Adaptable",
  description: "Réservez une place dans un créneau d’une heure, avec quatre personnes maximum.",
  price: formatDzd(offer.priceDzd),
  iconName: "Reformer",
}));
// Helper to format date string to French display
function formatDateFr(date: Date): { dayName: string; dayNum: number; monthName: string; fullFr: string; iso: string } {
  const daysFr = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const monthsFr = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  
  const dayName = daysFr[date.getUTCDay()];
  const dayNum = date.getUTCDate();
  const monthName = monthsFr[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const iso = date.toISOString().split("T")[0];

  return {
    dayName,
    dayNum,
    monthName,
    fullFr: `${dayName} ${dayNum} ${monthName} ${year}`,
    iso
  };
}

export function BookingWizard() {
  const requestRef = useRef<{ body: string; id: string } | null>(null);
  const [step, setStep] = useState<number>(1);
  const [selectedPractice, setSelectedPractice] = useState<PracticeType>(PRACTICES[0]);
  const [gender, setGender] = useState<GenderOption>("femme");
  
  const [minimumDay] = useState(() => firstBookingDay(Date.now()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => bookingCalendarDate(initialBookingDay(minimumDay)));
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  // Client Details Form State
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientLevel, setClientLevel] = useState("Débutant");
  const [paymentMethod, setPaymentMethod] = useState<"studio" | "credit">("studio");
  const [formError, setFormError] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState("pending");
  const [emailAccepted, setEmailAccepted] = useState(false);
  const [activationError, setActivationError] = useState("");

  const day = selectedDate.toISOString().slice(0, 10);
  const availabilityKey = `${day}/${gender}`;
  const [availability, setAvailability] = useState<{ key: string; slots: TimeSlot[]; error: string } | null>(null);
  useEffect(() => {
    if (step !== 3 && step !== 4) return;
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch(`/api/disponibilites?${new URLSearchParams({ day, audience: gender })}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Chargement impossible.");
        if (!controller.signal.aborted) setAvailability({ key: availabilityKey, slots: data.slots, error: "" });
      } catch (cause) {
        if (!controller.signal.aborted) setAvailability({ key: availabilityKey, slots: [], error: cause instanceof Error ? cause.message : "Chargement impossible." });
      }
    }
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [day, gender, availabilityKey, step]);
  const currentAvailability = availability?.key === availabilityKey ? availability : null;
  const daySchedule = { isOpen: selectedDate.getUTCDay() !== 5, slots: currentAvailability?.slots ?? [], reason: "Le studio est fermé le vendredi." };
  // Handle Date Selection
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(""); // reset slot selection on date change
  };

  const [loading, setLoading] = useState(false);

  // Handle Final Submit
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!clientName.trim() || clientName.trim().length < 2) {
      setFormError("Veuillez saisir votre Nom et Prénom.");
      return;
    }
    if (!clientPhone.trim() || clientPhone.trim().length < 8) {
      setFormError("Veuillez saisir un numéro de téléphone valide (ex: 05 53 02 17 14).");
      return;
    }

    if (!daySchedule.slots.some(slot => slot.time === selectedSlot && slot.available > 0)) {
      setFormError("Ce créneau n’est plus disponible. Revenez au calendrier pour choisir une place.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: (() => { const payload = {
          practiceId: selectedPractice.id,
          practiceName: selectedPractice.name,
          gender,
          date: selectedDate.toISOString().split("T")[0],
          slot: selectedSlot,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          clientEmail: clientEmail.trim() || undefined,
          clientLevel,
          paymentMethod,
        }; const body = JSON.stringify(payload); if (requestRef.current?.body !== body) requestRef.current = { body, id: crypto.randomUUID() }; return JSON.stringify({ ...payload, requestId: requestRef.current.id }); })(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible d'enregistrer la réservation.");
      }

      setBookingReference(data.bookingReference);
      setAccessStatus(data.accessStatus ?? "pending");
      setEmailAccepted(data.emailAccepted === true);
      if (typeof data.invitationUrl === "string") setInvitationUrl(data.invitationUrl);
      setStep(5); // Go to Confirmation step
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Une erreur est survenue lors de la réservation. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const retryActivation = async () => {
    if (!requestRef.current || loading) return;
    setLoading(true);
    setActivationError("");
    try {
      const response = await fetch("/api/reservation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...JSON.parse(requestRef.current.body), requestId: requestRef.current.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error("Votre réservation reste confirmée. L’activation n’a pas pu être reprise ; contactez le studio.");
      setAccessStatus(result.accessStatus ?? "pending");
      setEmailAccepted(result.emailAccepted === true);
      setInvitationUrl(typeof result.invitationUrl === "string" ? result.invitationUrl : null);
    } catch (error) {
      setActivationError(error instanceof Error ? error.message : "Activation indisponible. Contactez le studio.");
    } finally { setLoading(false); }
  };

  const selectedDateFr = formatDateFr(selectedDate);

  return (
    <div className="w-full">
      {step < 5 && <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#cdae72]/50 bg-white p-5"><p className="text-sm text-[#61574b]">Vous connaissez déjà le studio ? Retrouvez vos réservations et votre forfait.</p><Link href={`/espace-cliente?day=${day}`} className="rounded-full bg-[#1c1917] px-5 py-3 text-xs font-semibold text-white">Me connecter</Link></div>}
      {/* Wizard Progress Header */}
      {step < 5 && (
        <div className="mb-10">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#786c5e] mb-3">
            <span>Étape {step} sur 4</span>
            <span>
              {step === 1 && "Première visite ou séance libre"}
              {step === 2 && "Public & Créneau Horaires"}
              {step === 3 && "Sélection Date & Heure"}
              {step === 4 && "Vos Coordonnées & Validation"}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full rounded-full bg-[#e7dac8]/50 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#b7893b] to-[#99702d] transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* STEP 1: CHOIX DE LA PRATIQUE */}
      {step === 1 && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <h2 className="font-serif text-3xl font-light text-[#1c1917]">Réservez votre place</h2>
            <p className="mt-2 text-sm text-[#61574b]">
              Chaque créneau dure une heure et accueille quatre personnes maximum. Déjà cliente ? Connectez-vous pour réserver avec votre forfait.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {PRACTICES.map((p) => {
              const isSelected = selectedPractice.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPractice(p)}
                  className={`group relative cursor-pointer rounded-3xl border p-6 transition-all duration-300 ${
                    isSelected
                      ? "border-[#b7893b] bg-white shadow-xl shadow-[#b7893b]/10 ring-2 ring-[#b7893b]/30"
                      : "border-[#e5dacf] bg-white/70 hover:border-[#cdae72] hover:bg-white hover:shadow-md"
                  }`}
                >
                  {p.badge && (
                    <div className="absolute top-5 right-5 rounded-full bg-[#b7893b]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#99702d]">
                      {p.badge}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#99702d]">
                    <span>{p.category}</span>
                    <span>•</span>
                    <span>{p.duration}</span>
                  </div>

                  <h3 className="mt-3 font-serif text-xl font-normal text-[#1c1917] group-hover:text-[#99702d] transition-colors">
                    {p.name}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-[#61574b]">
                    {p.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-[#f0e6d8] pt-4">
                    <div className="text-sm font-bold text-[#1c1917]">
                      {p.price} <span className="text-[10px] font-normal text-[#706659]">/ séance</span>
                    </div>

                    <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                      isSelected ? "bg-[#b7893b] text-white" : "bg-[#faf7f2] text-[#706659] group-hover:bg-[#b7893b]/20 group-hover:text-[#99702d]"
                    }`}>
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-full bg-[#1c1917] px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-[#b7893b] hover:text-black shadow-lg"
            >
              <span>Continuer (Créneau Horaires)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: GENRE & RÈGLES DES CRÉNEAUX */}
      {step === 2 && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <h2 className="font-serif text-3xl font-light text-[#1c1917]">Pour qui est cette réservation ?</h2>
            <p className="mt-2 text-sm text-[#61574b]">
              Pour vous garantir sérénité et confort, notre studio applique un planning avec créneaux dédiés distincts pour Femmes et Hommes.
            </p>
          </div>

          {/* Gender Selector Cards */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div
              onClick={() => setGender("femme")}
              className={`cursor-pointer rounded-3xl border p-8 transition-all duration-300 ${
                gender === "femme"
                  ? "border-[#b7893b] bg-white shadow-xl ring-2 ring-[#b7893b]/30"
                  : "border-[#e5dacf] bg-white/70 hover:border-[#cdae72] hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b7893b]/15 text-[#99702d]">
                  <Users className="h-6 w-6" />
                </div>
                {gender === "femme" && (
                  <span className="rounded-full bg-[#b7893b] px-3 py-1 text-xs font-bold text-white">Sélectionné</span>
                )}
              </div>
              <h3 className="mt-5 font-serif text-2xl font-normal text-[#1c1917]">Créneaux Femmes</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#61574b]">
                Accès aux plages horaires réservées aux femmes :
              </p>
              <ul className="mt-4 space-y-2 text-xs font-medium text-[#38322a]">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#b7893b]" />
                  <span>Sam, Lun, Mer : <strong>10h00 – 14h00</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#b7893b]" />
                  <span>Dim, Mar, Jeu : <strong>10h00 – 18h00</strong></span>
                </li>
              </ul>
            </div>

            <div
              onClick={() => setGender("homme")}
              className={`cursor-pointer rounded-3xl border p-8 transition-all duration-300 ${
                gender === "homme"
                  ? "border-[#b7893b] bg-white shadow-xl ring-2 ring-[#b7893b]/30"
                  : "border-[#e5dacf] bg-white/70 hover:border-[#cdae72] hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1c1917]/10 text-[#1c1917]">
                  <Users className="h-6 w-6" />
                </div>
                {gender === "homme" && (
                  <span className="rounded-full bg-[#b7893b] px-3 py-1 text-xs font-bold text-white">Sélectionné</span>
                )}
              </div>
              <h3 className="mt-5 font-serif text-2xl font-normal text-[#1c1917]">Créneaux Hommes</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#61574b]">
                Accès aux plages horaires réservées aux hommes :
              </p>
              <ul className="mt-4 space-y-2 text-xs font-medium text-[#38322a]">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1c1917]" />
                  <span>Sam, Lun, Mer : <strong>14h00 – 20h00</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1c1917]" />
                  <span>Dim, Mar, Jeu : <strong>18h00 – 20h00</strong></span>
                </li>
              </ul>
            </div>
          </div>

          {/* Info Banner on Studio Capacity */}
          <div className="rounded-2xl border border-[#dccbb0] bg-[#faf7f2] p-5 flex items-start gap-4 text-xs text-[#524b42]">
            <Info className="h-5 w-5 text-[#99702d] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1c1917]">4 places par heure :</span> Les disponibilités sont partagées avec le planning du studio. Le studio est fermé le vendredi.
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#61574b] hover:text-[#1c1917]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Précédent</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-full bg-[#1c1917] px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-[#b7893b] hover:text-black shadow-lg"
            >
              <span>Choisir la Date & l&apos;Heure</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DATE & TIME SLOT SELECTION */}
      {step === 3 && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <h2 className="font-serif text-3xl font-light text-[#1c1917]">Choisissez la date et l&apos;heure</h2>
            <p className="mt-2 text-sm text-[#61574b]">
              Créneaux affichés pour : <strong className="text-[#99702d] uppercase">{gender === "femme" ? "Femmes" : "Hommes"}</strong> • Discipline : <strong>{selectedPractice.name}</strong>
            </p>
          </div>

          <BookingDatePicker value={selectedDateFr.iso} minimum={minimumDay} onChange={day => handleSelectDate(bookingCalendarDate(day))} />

          {/* Time Slots Grid */}
          <div className="rounded-3xl border border-[#e5dacf] bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#f0e6d8]">
              <div>
                <h3 className="font-serif text-xl font-normal text-[#1c1917]">
                  Créneaux disponibles le {selectedDateFr.fullFr}
                </h3>
                <p className="text-xs text-[#706659] mt-0.5">
                  Capacité limitée à 4 Reformers par heure
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[#61574b]">Places libres</span>
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 ml-2" />
                <span className="text-[#61574b]">Plus que 1 ou 2</span>
              </div>
            </div>

            {!currentAvailability ? <p role="status" className="py-8 text-center text-sm">Chargement des places disponibles…</p> : currentAvailability.error ? <p role="alert" className="py-8 text-center text-sm text-red-700">{currentAvailability.error}</p> : !daySchedule.isOpen ? (
              <div className="py-12 text-center text-[#706659] space-y-3">
                <CalendarIcon className="h-10 w-10 mx-auto text-[#cdae72]/60" />
                <p className="text-base font-medium">{daySchedule.reason}</p>
                <p className="text-xs">Veuillez sélectionner un autre jour de la semaine.</p>
              </div>
            ) : daySchedule.slots.length === 0 ? (
              <div className="py-12 text-center text-[#706659]">
                Aucun créneau ouvert pour ce public à la date sélectionnée.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {daySchedule.slots.map((slot) => {
                  const isSelected = selectedSlot === slot.time;
                  const isFull = slot.status === "full";

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={isFull}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all ${
                        isFull
                          ? "border-[#e5dacf] bg-[#faf7f2] opacity-50 cursor-not-allowed"
                          : isSelected
                          ? "border-[#b7893b] bg-[#faf7f2] shadow-md ring-2 ring-[#b7893b]"
                          : "border-[#e5dacf] bg-white hover:border-[#cdae72] hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#1c1917]">
                          <Clock className="h-4 w-4 text-[#99702d]" />
                          <span>{slot.time}</span>
                        </div>

                        {isSelected && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#b7893b] text-white">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="text-[#61574b]">4 machines max</span>

                        {isFull ? (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                            Complet
                          </span>
                        ) : slot.available <= 2 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                            <Flame className="h-3 w-3 text-amber-600" />
                            {slot.available} place{slot.available > 1 ? "s" : ""} restante{slot.available > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            {slot.available} places libres
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#61574b] hover:text-[#1c1917]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Précédent</span>
            </button>

            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => setStep(4)}
              className={`inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white transition-all shadow-lg ${
                selectedSlot
                  ? "bg-[#1c1917] hover:bg-[#b7893b] hover:text-black cursor-pointer"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              <span>Valider vos Coordonnées</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: FORMULAIRE DE RÉSERVATION */}
      {step === 4 && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <h2 className="font-serif text-3xl font-light text-[#1c1917]">Finalisez votre réservation</h2>
            <p className="mt-2 text-sm text-[#61574b]">
              Vérifiez le récapitulatif de votre séance et complétez vos informations de contact.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12">
            {/* Form Inputs Column */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSubmitBooking} className="rounded-3xl border border-[#e5dacf] bg-white p-6 sm:p-8 shadow-sm space-y-6">
                
                {formError && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#786c5e] mb-2">
                    Nom & Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Myriam Benali"
                    className="w-full rounded-2xl border border-[#dccbb0] bg-[#faf7f2] px-4 py-3.5 text-sm text-[#1c1917] focus:border-[#b7893b] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#786c5e] mb-2">
                      Téléphone (Mobile) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="05 53 02 17 14"
                      className="w-full rounded-2xl border border-[#dccbb0] bg-[#faf7f2] px-4 py-3.5 text-sm text-[#1c1917] focus:border-[#b7893b] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#786c5e] mb-2">
                      Adresse E-mail (facultative)
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="votre.email@exemple.com"
                      className="w-full rounded-2xl border border-[#dccbb0] bg-[#faf7f2] px-4 py-3.5 text-sm text-[#1c1917] focus:border-[#b7893b] focus:bg-white focus:outline-none transition-all"
                    />
                    <p className="mt-2 text-xs text-[#61574b]">Nécessaire pour recevoir votre accès et gérer vos réservations en ligne. Sans e-mail, contactez le studio pour activer votre espace.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#786c5e] mb-2">
                    Votre niveau de pratique Pilates
                  </label>
                  <select
                    value={clientLevel}
                    onChange={(e) => setClientLevel(e.target.value)}
                    className="w-full rounded-2xl border border-[#dccbb0] bg-[#faf7f2] px-4 py-3.5 text-sm text-[#1c1917] focus:border-[#b7893b] focus:bg-white focus:outline-none transition-all"
                  >
                    <option value="Débutant">Débutant(e) — Premier cours au studio</option>
                    <option value="Intermédiaire">Intermédiaire — Pratique occasionnelle</option>
                    <option value="Avancé">Avancé — Pratique régulière du Reformer</option>
                  </select>
                </div>

                {/* Option de règlement */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#786c5e] mb-3">
                    Mode de règlement souhaité
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label 
                      onClick={() => setPaymentMethod("studio")}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all ${
                        paymentMethod === "studio"
                          ? "border-[#b7893b] bg-[#faf7f2] font-semibold text-[#1c1917]"
                          : "border-[#e5dacf] bg-white text-[#61574b]"
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === "studio"} 
                        onChange={() => setPaymentMethod("studio")}
                        className="accent-[#b7893b]" 
                      />
                      <span className="text-xs">Règlement au studio (Espèces)</span>
                    </label>

                    <Link href="/espace-cliente" className="rounded-2xl border border-[#e5dacf] p-4 text-xs underline">Déjà cliente ? Connectez-vous pour utiliser votre forfait.</Link>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#f0e6d8] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#61574b] hover:text-[#1c1917]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Retour</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1c1917] px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-[#b7893b] hover:text-black shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[#e5be78]" />
                        <span>Enregistrement en cours...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-[#e5be78]" />
                        <span>Confirmer ma Réservation</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Summary Sidebar Column */}
            <div className="lg:col-span-5">
              <div className="sticky top-28 rounded-3xl border border-[#cdae72]/40 bg-gradient-to-b from-[#1c1917] to-[#2c2621] p-6 sm:p-8 text-white shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#e5be78]">Récapitulatif</span>
                  <Sparkles className="h-4 w-4 text-[#e5be78]" />
                </div>

                <div>
                  <div className="text-xs text-white/60 uppercase tracking-wider">Discipline</div>
                  <div className="mt-1 font-serif text-2xl font-light text-white">{selectedPractice.name}</div>
                  <div className="text-xs text-[#e5be78] mt-1">{selectedPractice.category} • {selectedPractice.duration}</div>
                </div>

                <div className="space-y-3 border-t border-b border-white/10 py-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60">Public réservé :</span>
                    <span className="font-semibold text-white uppercase">{gender === "femme" ? "Créneau Femmes" : "Créneau Hommes"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-white/60">Date sélectionnée :</span>
                    <span className="font-semibold text-white">{selectedDateFr.fullFr}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-white/60">Heure du cours :</span>
                    <span className="font-semibold text-[#e5be78]">{selectedSlot}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-white/60">Lieu du studio :</span>
                    <span className="font-semibold text-white">Centre Zemzem (Bir Mourad Raïs)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-white/80">Tarif de la séance :</span>
                  <span className="font-serif text-2xl font-bold text-[#e5be78]">{selectedPractice.price}</span>
                </div>

                <div className="rounded-2xl bg-white/10 p-4 text-[11px] text-white/70 flex items-start gap-2">
                  <Shield className="h-4 w-4 shrink-0 text-[#e5be78] mt-0.5" />
                  <span>Pour gérer votre réservation, utilisez votre espace cliente ou contactez le studio au 05 53 02 17 14.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* STEP 5: CONFIRMATION SÉCURISÉE */}
      {step === 5 && (
        <div className="mx-auto max-w-2xl text-center space-y-8 animate-fadeIn">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#b7893b]/20 text-[#99702d]">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#b7893b]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#99702d]">
              Réservation Confirmée
            </div>

            <h2 className="mt-4 font-serif text-4xl font-light text-[#1c1917]">
              Votre place est réservée avec succès !
            </h2>

            <p className="mt-3 text-sm text-[#61574b]">
              Merci <strong className="text-[#1c1917]">{clientName}</strong>. Votre place est réservée au studio Pilates Center Alger.
            </p>
          </div>

          {/* Ticket Card */}
          <div className="rounded-3xl border border-[#cdae72]/40 bg-white p-8 shadow-xl text-left space-y-6">
            <div className="flex items-center justify-between border-b border-[#f0e6d8] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#99702d]">Code de Réservation</span>
                <div className="break-all font-mono text-lg font-bold text-[#1c1917]">{bookingReference}</div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#99702d]">Statut</span>
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  Confirmé
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-[#706659]">Discipline :</span>
                <div className="font-semibold text-[#1c1917] text-sm mt-0.5">{selectedPractice.name}</div>
              </div>

              <div>
                <span className="text-[#706659]">Créneau & Heure :</span>
                <div className="font-semibold text-[#99702d] text-sm mt-0.5">{selectedSlot}</div>
              </div>

              <div>
                <span className="text-[#706659]">Date de la séance :</span>
                <div className="font-semibold text-[#1c1917] mt-0.5">{selectedDateFr.fullFr}</div>
              </div>

              <div>
                <span className="text-[#706659]">Nom du client :</span>
                <div className="font-semibold text-[#1c1917] mt-0.5">{clientName} ({clientPhone})</div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#faf7f2] p-4 text-xs space-y-2 text-[#524b42]">
              <div className="flex items-center gap-2 font-semibold text-[#1c1917]">
                <MapPin className="h-4 w-4 text-[#99702d]" />
                <span>Centre Commercial Zemzem, Bir Mourad Raïs</span>
              </div>
              <p className="text-[11px] text-[#706659] pl-6">
                Pensez à arriver 10 minutes avant le début de votre séance muni(e) d&apos;une tenue de sport confortable et de chaussettes antidérapantes.
              </p>
            </div>

            {/* Account Creation & Password Setup Card */}
            <div className="rounded-2xl border border-[#b7893b]/40 bg-[#faf6ef] p-5 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-[#99702d] text-sm">
                <KeyRound className="h-4.5 w-4.5 text-[#b7893b]" />
                <span>Activer votre espace cliente</span>
              </div>
              <p className="text-[#61574b] leading-relaxed">
                {accessStatus === "no-email" ? "Votre réservation est confirmée. Aucun accès en ligne n’a été créé sans adresse e-mail. Contactez le studio pour compléter votre fiche et activer votre espace."
                  : accessStatus === "pending" ? "Votre réservation est confirmée, mais votre accès en ligne n’est pas encore prêt. Réessayez l’activation ou contactez le studio."
                  : "Votre accès en ligne est créé. Définissez votre mot de passe pour gérer vos réservations et vos forfaits."}
              </p>
              {invitationUrl ? (
                <a
                  href={invitationUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#b7893b] px-5 py-2.5 text-xs font-bold text-black hover:bg-[#d5ae65] transition-all shadow-sm"
                >
                  <span>Créer mon mot de passe</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              ) : emailAccepted ? (
                <p className="text-[11px] font-medium text-[#8b652b]">
                  La demande d’envoi du lien à {clientEmail} a été acceptée. Vérifiez votre boîte de réception et vos courriers indésirables. Vous pouvez aussi utiliser « Mot de passe oublié » depuis la page de connexion.
                </p>
              ) : accessStatus === "invitation-pending" ? <p>L’envoi du lien n’est pas confirmé. Attendez une minute avant de réessayer, ou utilisez « Mot de passe oublié » depuis la page de connexion.</p> : null}
              {(accessStatus === "pending" || accessStatus === "invitation-pending") && <button type="button" disabled={loading} onClick={retryActivation} className="rounded-xl bg-[#1c1917] px-5 py-3 text-white disabled:opacity-50">{loading ? "Activation en cours…" : "Réessayer l’activation"}</button>}
              {activationError && <p role="alert">{activationError}</p>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-[#cdae72]/60 px-8 py-3.5 text-xs font-semibold text-[#1c1917] hover:bg-white"
            >
              <span>Retour à l&apos;accueil</span>
            </Link>

            <Link
              href="/espace-cliente"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#1c1917] px-8 py-3.5 text-xs font-semibold text-white hover:bg-[#b7893b] hover:text-black shadow-md"
            >
              <span>Accéder à mon espace cliente</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
