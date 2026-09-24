import Link from "next/link";
import { ArrowLeft, Lock, Database, UserCheck, KeyRound } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";

export const metadata = {
  title: "Politique de Confidentialité · Pilates Center Alger",
  description: "Engagement sur la protection des données personnelles et règles de confidentialité du studio Pilates Center.",
};

export default function PolitiqueConfidentialitePage() {
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
          Protection des Données Personnelles
        </div>

        <h1 className="mt-6 font-serif text-4xl font-light text-[#1c1917] sm:text-5xl">
          Politique de Confidentialité
        </h1>
        <p className="mt-4 text-base text-[#61574b]">
          Pilates Center s&apos;engage à respecter la vie privée et la confidentialité de l&apos;ensemble de ses clientes et utilisateurs.
        </p>

        <div className="mt-12 space-y-10 text-[#403930] leading-relaxed">
          
          {/* Section 1 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#99702d]">
              <Database className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-normal text-[#1c1917]">1. Collecte des Données</h2>
            </div>
            <p className="mt-4 text-sm text-[#61574b]">
              Nous collectons uniquement les informations nécessaires au traitement de vos réservations, à la gestion de vos crédits de cours et au suivi de vos séances :
            </p>
            <ul className="mt-3 list-disc pl-5 text-sm space-y-1.5">
              <li>Nom, prénom et coordonnées de contact (e-mail, téléphone).</li>
              <li>Historique des inscriptions aux cours et assiduité aux séances.</li>
              <li>Abonnements, crédits attribués et règlements consignés.</li>
              <li>Identifiants de connexion chiffrés pour l&apos;accès à l&apos;espace cliente.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#99702d]">
              <Lock className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-normal text-[#1c1917]">2. Utilisation & Finalités</h2>
            </div>
            <p className="mt-4 text-sm">
              Vos données sont strictement réservées à l&apos;usage interne du studio Pilates Center Alger pour :
            </p>
            <ul className="mt-3 list-disc pl-5 text-sm space-y-1.5">
              <li>Permettre l’accès à votre espace personnel et la réservation de cours.</li>
              <li>Assurer la gestion du nombre de places limité ({`4 à 6`} participantes par cours).</li>
              <li>Gérer la comptabilité interne des encaissements en espèces et l&apos;attribution des crédits.</li>
              <li>Vous informer en cas de modification d&apos;horaires ou d&apos;imprévu sur un cours réservé.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#99702d]">
              <KeyRound className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-normal text-[#1c1917]">3. Sécurité des Accès & Cookies</h2>
            </div>
            <p className="mt-4 text-sm">
              La connexion à l&apos;espace membre s&apos;effectue via un cookie de session sécurisé (`HttpOnly`) d&apos;une durée de 8 heures. Nous n&apos;utilisons aucun cookie d&apos;analyse ou de traçage publicitaire intrusif.
            </p>
          </section>

          {/* Section 4 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#99702d]">
              <UserCheck className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-normal text-[#1c1917]">4. Droits des Clientes</h2>
            </div>
            <p className="mt-4 text-sm">
              Conformément à la réglementation sur la protection des données, vous disposez à tout moment d’un droit d’accès, de rectification et de suppression de vos données personnelles. Pour toute demande, il vous suffit de vous adresser directement à l&apos;accueil du studio ou de nous contacter au <strong>05 53 02 17 14</strong>.
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
            <Link href="/cgv" className="hover:underline">CGV</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
