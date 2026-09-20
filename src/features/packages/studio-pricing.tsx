import { COURSE_DURATION_MINUTES, COURSE_MAX_CAPACITY, SINGLE_SESSION_OFFERS, MONTHLY_OFFERS, QUARTERLY_DISCOUNT_PERCENT, quarterlyPrice, formatDzd } from "@/domain/models/studio-offers";
import { Check, Sparkles, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function StudioPricing() {
  return (
    <section id="tarifs" className="relative space-y-12 py-8" aria-labelledby="studio-pricing-title">
      {/* Glow decorative blur */}
      <div className="pointer-events-none absolute -left-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[#b7893b]/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-[#cdae72]/15 blur-[120px]" />

      <div className="relative text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#b7893b]/30 bg-[#b7893b]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#99702d]">
          <Sparkles className="h-3.5 w-3.5" /> Offres & Abonnements
        </div>
        <h2 id="studio-pricing-title" className="mt-4 font-serif text-4xl font-light leading-tight sm:text-5xl text-[#1a1714]">
          Votre rythme, votre formule.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-[#676056]">
          Séances de {COURSE_DURATION_MINUTES} minutes en petit comité ({COURSE_MAX_CAPACITY} participantes maximum) pour une attention constante et personnalisée.
        </p>
      </div>

      {/* Cartes & Séances Uniques */}
      <div>
        <h3 className="mb-6 font-serif text-2xl font-light text-[#221e1a]">Séances à la carte</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          {SINGLE_SESSION_OFFERS.map(offer => (
            <article 
              key={offer.id} 
              className="group relative flex flex-col justify-between rounded-3xl border border-[#e5dacf] bg-white/80 p-8 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#b7893b]/50 hover:shadow-xl hover:shadow-[#b7893b]/10"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#f4efe6] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#8b652b]">
                    {offer.id === "discovery" ? "Découverte" : "Séance libre"}
                  </span>
                  <span className="text-xs text-[#8c8275]">1 séance</span>
                </div>
                <h4 className="mt-4 font-serif text-2xl font-normal text-[#1a1714]">{offer.label}</h4>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-light tracking-tight text-[#9a702c]">{formatDzd(offer.priceDzd)}</span>
                </div>
                <p className="mt-3 text-sm text-[#736a5e]">
                  Accès à 1 cours au choix avec coach dédié, matériel fourni et vestiaires privatifs.
                </p>
              </div>

              <div className="mt-8 border-t border-[#f0e8dd] pt-6">
                <Link
                  href="/reservation"
                  className="inline-flex w-full items-center justify-center rounded-full border border-[#b7893b]/40 bg-transparent px-5 py-3 text-sm font-semibold text-[#1a1714] transition-all hover:bg-[#1a1714] hover:text-white"
                >
                  Réserver cette séance
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Abonnements Mensuels & Trimestriels */}
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-2xl font-light text-[#221e1a]">Abonnements réguliers</h3>
            <p className="text-sm text-[#756c60]">Bénéficiez de remises exclusives pour un engagement régulier.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b7893b]/40 bg-[#b7893b]/15 px-3 py-1 text-xs font-semibold text-[#99702d]">
            <ShieldCheck className="h-3.5 w-3.5" /> Avantage -{QUARTERLY_DISCOUNT_PERCENT}% en paiement trimestriel
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {MONTHLY_OFFERS.map((offer, idx) => (
            <article 
              key={offer.id} 
              className={`group relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                idx === 1 
                  ? "border-2 border-[#b7893b] bg-gradient-to-b from-[#fdfbf7] via-[#f7efe4] to-[#f4e8d4] shadow-xl shadow-[#b7893b]/15" 
                  : "border border-[#dccbb0] bg-gradient-to-b from-[#ffffff] to-[#faf4eb] shadow-sm hover:shadow-lg"
              }`}
            >
              {idx === 1 && (
                <div className="absolute -top-3.5 right-8 rounded-full bg-[#1a1714] px-4 py-1 text-xs font-medium tracking-wider text-[#e5be78] shadow-md">
                  Recommandé
                </div>
              )}
              
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#b7893b]/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#7e581b]">
                    Abonnement Mensuel
                  </span>
                  <span className="text-xs font-medium text-[#7e581b]">{offer.sessionsPerMonth} cours / mois</span>
                </div>

                <h4 className="mt-4 font-serif text-3xl font-light text-[#1a1714]">
                  {offer.sessionsPerMonth} séances <span className="text-lg text-[#676056]">/ mois</span>
                </h4>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-serif text-5xl font-light tracking-tight text-[#8b652b]">
                    {formatDzd(offer.priceDzd)}
                  </span>
                  <span className="text-sm text-[#706659]">/ mensuel</span>
                </div>

                <div className="mt-6 rounded-2xl border border-[#cdae72]/40 bg-white/70 p-4 backdrop-blur-sm">
                  <div className="text-xs font-medium uppercase tracking-wider text-[#99702d]">Formule Trimestrielle</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-serif text-2xl font-normal text-[#1a1714]">
                      {formatDzd(quarterlyPrice(offer.priceDzd))}
                    </span>
                    <span className="text-xs font-semibold text-[#8b652b]">
                      −{QUARTERLY_DISCOUNT_PERCENT}% d’économie
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#706659]">
                    Formule de 3 mois ({offer.sessionsPerMonth * 3} séances). Paiement en espèces, avec acomptes possibles.
                  </p>
                </div>

                <ul className="mt-6 space-y-2.5 text-sm text-[#595146]">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#8b652b]" /> Réservation selon les places disponibles
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#8b652b]" /> Suivi de vos crédits dans votre espace personnel
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#8b652b]" /> Suivi personnalisé par nos coachs certifiées
                  </li>
                </ul>
              </div>

              <div className="mt-8 border-t border-[#cdae72]/30 pt-6">
                <Link
                  href="/reservation"
                  className={`inline-flex w-full items-center justify-center rounded-full px-5 py-3.5 text-sm font-semibold transition-all ${
                    idx === 1 
                      ? "bg-[#1a1714] text-white shadow-lg hover:bg-[#b7893b] hover:text-black" 
                      : "bg-[#b7893b] text-black hover:bg-[#d7b66f]"
                  }`}
                >
                  Souscrire cette formule
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
