import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, CalendarCheck, ShieldCheck, CreditCard } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { COURSE_DURATION_MINUTES, COURSE_MAX_CAPACITY } from "@/domain/models/studio-offers";

export const metadata = {
  title: "Conditions Générales de Vente (CGV) · Pilates Center Alger",
  description: "Conditions générales de vente, règles de réservation, annulation et souscription d'abonnements Pilates Center.",
};

export default function CgvPage() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1c1917] font-sans antialiased selection:bg-[#b7893b] selection:text-white">
      
      {/* Header */}
      <header className="border-b border-[#e7dac8]/60 bg-[#faf7f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <BrandLockup compact />
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#cdae72]/50 px-4 py-2 text-xs font-semibold text-[#38322a] transition-all hover:bg-[#f3e6d3]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-16 lg:px-10 lg:py-24">
        
        <div className="inline-flex items-center gap-2 rounded-full border border-[#b7893b]/30 bg-[#b7893b]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#99702d]">
          Conditions Contractuelles
        </div>

        <h1 className="mt-6 font-serif text-4xl font-light text-[#1c1917] sm:text-5xl">
          Conditions Générales de Vente (CGV)
        </h1>
        <p className="mt-4 text-base text-[#61574b]">
          Règles de souscription, politiques de réservation et fonctionnement du studio Pilates Center Alger.
        </p>

        <div className="mt-12 space-y-10 text-[#403930] leading-relaxed">
          
          {/* Article 1 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#99702d]">
              <BookOpen className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-normal text-[#1c1917]">Article 1 – Objet & Prestations</h2>
            </div>
            <p className="mt-4 text-sm text-[#61574b]">
              Les présentes CGV régissent l&apos;ensemble des réservations et abonnements souscrits auprès du studio <strong>Pilates Center Alger</strong>. Le studio propose des cours de Pilates au sol (Mat) et Pilates Reformer, dispensés en séances individuelles ou en cours collectifs d&apos;une durée de <strong>{COURSE_DURATION_MINUTES} minutes</strong> limités à <strong>{COURSE_MAX_CAPACITY} personnes maximum</strong>.
            </p>
          </section>

          {/* Article 2 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#99702d]">
              <CreditCard className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-normal text-[#1c1917]">Article 2 – Tarifs & Règlement en Espèces</h2>
            </div>
            <p className="mt-4 text-sm">
              Les tarifs sont indiqués en Dinars Algériens (DZD). Les règlements s&apos;effectuent directement au studio à l&apos;accueil en <strong>espèces</strong> (paiement comptant ou versement d&apos;acompte avec solde consigné). Un reçu ou journal d&apos;encaissement est systématiquement attribué à la cliente lors du règlement.
            </p>
          </section>

          {/* Article 3 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#99702d]">
              <CalendarCheck className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-normal text-[#1c1917]">Article 3 – Réservation & Annulation des Cours</h2>
            </div>
            <ul className="mt-4 list-disc pl-5 text-sm space-y-2">
              <li>Toute réservation s&apos;effectue via l&apos;espace client en ligne ou directement auprès de l&apos;accueil du studio.</li>
              <li>Toute réservation immobilise un crédit d’un forfait valable à la date du créneau. Ce crédit est consommé après la fin de la séance, selon la validation manuelle ou automatique choisie par le centre.</li>
              <li><strong>Annulation anticipée :</strong> Vous pouvez annuler avant le début du créneau. Le crédit réservé est alors libéré ; la date de validité du forfait reste inchangée.</li>
              <li><strong>Après le début du créneau :</strong> L’annulation en ligne n’est plus disponible. Contactez le centre pour toute demande de correction. Le suivi des présences et absences est distinct de la validation des crédits.</li>
            </ul>
          </section>

          {/* Article 4 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#99702d]">
              <Clock className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-normal text-[#1c1917]">Article 4 – Validité des Abonnements & Crédits</h2>
            </div>
            <p className="mt-4 text-sm">
              Les formules (séances à l&apos;unité, cartes de crédits, abonnements mensuels et trimestriels) comportent une période de validité définie lors de la souscription. Les crédits non consommés à l&apos;expiration de la période de validité ne sont pas remboursables.
            </p>
          </section>

          {/* Article 5 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#99702d]">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-normal text-[#1c1917]">Article 5 – Horaires & Respect du Règlement</h2>
            </div>
            <p className="mt-4 text-sm">
              Les clientes et membres s&apos;engagent à respecter les créneaux d&apos;ouverture ainsi que la répartition horaire dédiée aux Femmes et aux Hommes (consultez les horaires et les exceptions dans le calendrier de réservation). Une tenue de sport adaptée est exigée pour l&apos;accès aux appareils et aux tapis.
            </p>
          </section>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#b7893b]/30 bg-[#0c0a09] py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row lg:px-10">
          <BrandLockup light compact />
          <div className="flex gap-6 text-xs text-white/60">
            <Link href="/mentions-legales" className="hover:underline">Mentions légales</Link>
            <Link href="/politique-de-confidentialite" className="hover:underline">Confidentialité</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
