import { COURSE_DURATION_MINUTES, COURSE_MAX_CAPACITY, SINGLE_SESSION_OFFERS, MONTHLY_OFFERS, QUARTERLY_DISCOUNT_PERCENT, quarterlyPrice, formatDzd } from "@/domain/models/studio-offers";

export function StudioPricing() {
  return <section id="tarifs" className="space-y-6" aria-labelledby="studio-pricing-title">
    <div><p className="text-xs uppercase tracking-[.25em] text-[#99702d]">Nos tarifs</p><h2 id="studio-pricing-title" className="mt-3 font-serif text-4xl">Votre rythme, votre formule.</h2><p className="mt-4 text-sm text-[#676056]">Cours de {COURSE_DURATION_MINUTES} minutes · {COURSE_MAX_CAPACITY} personnes maximum.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">{SINGLE_SESSION_OFFERS.map(offer => <article key={offer.id} className="rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-6"><h3 className="text-lg font-medium">{offer.label}</h3><p className="mt-4 font-serif text-3xl text-[#8b652b]">{formatDzd(offer.priceDzd)}</p><p className="mt-2 text-sm text-[#676056]">Une séance</p></article>)}</div>
    <div className="grid gap-4 sm:grid-cols-2">{MONTHLY_OFFERS.map(offer => <article key={offer.id} className="rounded-2xl border border-[#cdae72] bg-[#f7efe4] p-6"><h3 className="text-lg font-medium">{offer.sessionsPerMonth} séances par mois</h3><p className="mt-4 font-serif text-3xl text-[#8b652b]">{formatDzd(offer.priceDzd)}<span className="font-sans text-sm text-[#676056]"> / mois</span></p><p className="mt-5 border-t border-[#cdae72]/40 pt-4 text-sm">Paiement trimestriel : <strong>{formatDzd(quarterlyPrice(offer.priceDzd))}</strong></p><p className="mt-2 text-sm text-[#676056]">−{QUARTERLY_DISCOUNT_PERCENT} % sur trois mensualités · {offer.sessionsPerMonth} séances par mois.</p></article>)}</div>
  </section>;
}
