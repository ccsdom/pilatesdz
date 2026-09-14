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
            <span>Retour à l'accueil</span>
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
              Les présentes CGV régissent l'ensemble des réservations et abonnements souscrits auprès du studio <strong>Pilates Center Alger</strong>. Le studio propose des cours de Pilates au sol (Mat) et Pilates Reformer, dispensés en séances individuelles ou en cours collectifs d'une durée de <strong>{COURSE_DURATION_MINUTES} minutes</strong> limités à <strong>{COURSE_MAX_CAPACITY} personnes maximum</strong>.
            </p>
          </section>

          {/* Article 2 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#99702d]">
              <CreditCard className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-normal text-[#1c1917]">Article 2 – Tarifs & Règlement en Espèces</h2>
            </div>
            <p className="mt-4 text-sm">
              Les tarifs sont indiqués en Dinars Algériens (DZD). Les règlements s'effectuent directement au studio à l'accueil en <strong>espèces</strong> (paiement comptant ou versement d'acompte avec solde consigné). Un reçu ou journal d'encaissement est systématiquement attribué à la cliente lors du règlement.
            </p>
          </section>

          {/* Article 3 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#99702d]">
              <CalendarCheck className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-normal text-[#1c1917]">Article 3 – Réservation & Annulation des Cours</h2>
            </div>
            <ul className="mt-4 list-disc pl-5 text-sm space-y-2">
              <li>Toute réservation s'effectue via l'espace client en ligne ou directement auprès de l'accueil du studio.</li>
              <li>Toute séance réservée consomme un crédit de votre forfait actif.</li>
              <li><strong>Annulation anticipée :</strong> L'annulation d'un cours est gratuite si elle intervient dans le respect du délai d'anticipation minimum. Le crédit correspondant est automatiquement restitué sur votre compte.</li>
              <li><strong>Annulation tardive ou absence :</strong> En cas d'annulation tardive ou d'absence non justifiée, le crédit de la séance reste débité.</li>
            </ul>
          </section>

          {/* Article 4 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#99702d]">
              <Clock className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-normal text-[#1c1917]">Article 4 – Validité des Abonnements & Crédits</h2>
            </div>
            <p className="mt-4 text-sm">
              Les formules (séances à l'unité, cartes de crédits, abonnements mensuels et trimestriels) comportent une période de validité définie lors de la souscription. Les crédits non consommés à l'expiration de la période de validité ne sont pas remboursables.
            </p>
          </section>

          {/* Article 5 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#99702d]">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-normal text-[#1c1917]">Article 5 – Horaires & Respect du Règlement</h2>
            </div>
            <p className="mt-4 text-sm">
              Les clientes et membres s'engagent à respecter les créneaux d'ouverture ainsi que la répartition horaire dédiée aux Femmes et aux Hommes (du Samedi au Jeudi de 10h00 à 20h00). Une tenue de sport adaptée est exigée pour l'accès aux appareils et aux tapis.
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
