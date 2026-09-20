"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
  Loader2
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

const PRACTICES: PracticeType[] = [
  {
    id: "reformer-core",
    name: "Pilates Reformer Core",
    category: "Signature Reformer",
    duration: "60 min",
    intensity: "Modérée à Intense",
    description: "Renforcement profond sur machine Reformer. Travail complet de la sangle abdominale, posture et tonification.",
    price: "3 500 DA",
    badge: "Le plus populaire",
    iconName: "Reformer"
  },
  {
    id: "reformer-sculpt",
    name: "Reformer Sculpt & Flow",
    category: "Sculpting",
    duration: "60 min",
    intensity: "Dynamique",
    description: "Enchaînements fluides et sculptants pour affiner la silhouette et améliorer la souplesse sur machine.",
    price: "3 500 DA",
    iconName: "Sparkles"
  },
  {
    id: "mat-accessories",
    name: "Pilates Mat & Accessoires",
    category: "Fondations",
    duration: "60 min",
    intensity: "Douce à Modérée",
    description: "Travail au sol avec petits matériels (ring, foam roller, bandes élastiques) pour corriger les déséquilibres.",
    price: "2 500 DA",
    iconName: "Layers"
  },
  {
    id: "tower-chair",
    name: "Pilates Tower & Chair",
    category: "Équipement Spécialisé",
    duration: "60 min",
    intensity: "Intermédiaire",
    description: "Combinaison de la tour et de la chaise Pilates pour renforcer la colonne et la stabilité des articulations.",
    price: "3 800 DA",
    iconName: "Zap"
  },
  {
    id: "essai-decouverte",
    name: "Séance d'Essai Découverte",
    category: "Offre Découverte",
    duration: "60 min",
    intensity: "Adaptable",
    description: "Idéal pour votre première séance au studio. Inclus diagnostic postural et initiation au Reformer.",
    price: "2 000 DA",
    badge: "Spécial 1ère visite",
    iconName: "Star"
  },
  {
    id: "cours-particulier",
    name: "Coaching Privé 1-on-1",
    category: "Sur Mesure",
    duration: "60 min",
    intensity: "Personnalisée",
    description: "Accompagnement individuel exclusif avec un coach dédié. Programme 100% adapté à vos objectifs.",
    price: "7 000 DA",
    badge: "Exclusif",
    iconName: "Crown"
  }
];

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

// Generate schedule slots according to Studio Rules
function getSlotsForDateAndGender(date: Date, gender: GenderOption): { isOpen: boolean; slots: TimeSlot[]; reason?: string } {
  const dayOfWeek = date.getUTCDay(); // 0 = Dimanche, 1 = Lundi, ..., 5 = Vendredi, 6 = Samedi
  const capacity = 4; // Exactly 4 places per slot (Reformer machines count)

  // Vendredi (5) -> Studio Fermé
  if (dayOfWeek === 5) {
    return {
      isOpen: false,
      slots: [],
      reason: "Le studio est fermé le vendredi."
    };
  }

  let slotTimes: string[] = [];

  // Days: Samedi (6), Lundi (1), Mercredi (3)
  if (dayOfWeek === 6 || dayOfWeek === 1 || dayOfWeek === 3) {
    if (gender === "femme") {
      // Femmes : 10h00 - 14h00
      slotTimes = ["10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00", "13:00 - 14:00"];
    } else {
      // Hommes : 14h00 - 20h00
      slotTimes = ["14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00"];
    }
  } 
  // Days: Dimanche (0), Mardi (2), Jeudi (4)
  else if (dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4) {
    if (gender === "femme") {
      // Femmes : 10h00 - 18h00
      slotTimes = [
        "10:00 - 11:00", 
        "11:00 - 12:00", 
        "12:00 - 13:00", 
        "13:00 - 14:00", 
        "14:00 - 15:00", 
        "15:00 - 16:00", 
        "16:00 - 17:00", 
        "17:00 - 18:00"
      ];
    } else {
      // Hommes : 18h00 - 20h00
      slotTimes = ["18:00 - 19:00", "19:00 - 20:00"];
    }
  }

  // Generate realistic deterministic capacity for each slot
  const seedStr = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}-${gender}`;
  const slots: TimeSlot[] = slotTimes.map((time, idx) => {
    // Generate simulated reserved count between 0 and 4
    const charCodeSum = seedStr.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) + idx * 7;
    let reserved = (charCodeSum % 4); // 0, 1, 2, or 3
    if (idx === 1 && charCodeSum % 3 === 0) reserved = 4; // make one slot full occasionally
    const available = capacity - reserved;

    let status: "available" | "limited" | "full" = "available";
    if (available === 0) status = "full";
    else if (available <= 2) status = "limited";

    return {
      time,
      totalCapacity: capacity,
      reserved,
      available,
      status
    };
  });

  return {
    isOpen: true,
    slots
  };
}

export function BookingWizard() {
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

  // Compute current schedule based on selected date & gender
  const daySchedule = useMemo(() => {
    return getSlotsForDateAndGender(selectedDate, gender);
  }, [selectedDate, gender]);

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

    setLoading(true);

    try {
      const res = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible d'enregistrer la réservation.");
      }

      setBookingReference(data.bookingReference || `PIL-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setStep(5); // Go to Confirmation step
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Une erreur est survenue lors de la réservation. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const selectedDateFr = formatDateFr(selectedDate);

  return (
    <div className="w-full">
      {/* Wizard Progress Header */}
      {step < 5 && (
        <div className="mb-10">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#786c5e] mb-3">
            <span>Étape {step} sur 4</span>
            <span>
              {step === 1 && "Choix de la Pratique"}
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
            <h2 className="font-serif text-3xl font-light text-[#1c1917]">Sélectionnez votre discipline</h2>
            <p className="mt-2 text-sm text-[#61574b]">
              Chaque cours dure 60 minutes et se déroule en petit groupe de 4 personnes maximum pour une attention personnalisée.
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
              <span className="font-bold text-[#1c1917]">Capacité Garantie de 4 Reformers :</span> Tous les cours sont limités strictement à 4 participant(e)s pour assurer la qualité du guidage postural et un confort optimal. Le studio est fermé tous les vendredis.
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

            {!daySchedule.isOpen ? (
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
                      Adresse E-mail
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="votre.email@exemple.com"
                      className="w-full rounded-2xl border border-[#dccbb0] bg-[#faf7f2] px-4 py-3.5 text-sm text-[#1c1917] focus:border-[#b7893b] focus:bg-white focus:outline-none transition-all"
                    />
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
                      <span className="text-xs">Règlement au studio (Espèces/CIB)</span>
                    </label>

                    <label 
                      onClick={() => setPaymentMethod("credit")}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all ${
                        paymentMethod === "credit"
                          ? "border-[#b7893b] bg-[#faf7f2] font-semibold text-[#1c1917]"
                          : "border-[#e5dacf] bg-white text-[#61574b]"
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === "credit"} 
                        onChange={() => setPaymentMethod("credit")}
                        className="accent-[#b7893b]" 
                      />
                      <span className="text-xs">Déduire de mon pass / crédit membre</span>
                    </label>
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
                  <span>Annulation gratuite jusqu’à 12 heures avant le début du cours via votre espace cliente ou par téléphone au 05 53 02 17 14.</span>
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
              Merci <strong className="text-[#1c1917]">{clientName}</strong>. Nous avons bien enregistré votre cours au studio Pilates Center Alger.
            </p>
          </div>

          {/* Ticket Card */}
          <div className="rounded-3xl border border-[#cdae72]/40 bg-white p-8 shadow-xl text-left space-y-6">
            <div className="flex items-center justify-between border-b border-[#f0e6d8] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#99702d]">Code de Réservation</span>
                <div className="font-mono text-2xl font-bold text-[#1c1917]">{bookingReference}</div>
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
