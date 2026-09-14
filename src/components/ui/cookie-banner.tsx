"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X, Check, ShieldCheck } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("pilates_center_cookie_consent");
    if (!consent) {
      // Show banner after short delay
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("pilates_center_cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("pilates_center_cookie_consent", "essential_only");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-5 right-5 left-5 z-50 mx-auto max-w-xl animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="relative overflow-hidden rounded-3xl border border-[#cdae72]/40 bg-[#faf7f2]/95 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
        
        {/* Glow accent */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#b7893b]/15 blur-2xl" />

        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#b7893b]/20 text-[#99702d]">
            <Cookie className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-normal text-[#1c1917]">
                Gestion des cookies & Sérénité
              </h3>
              <button 
                onClick={handleDecline} 
                className="rounded-full p-1 text-[#786c5e] transition-colors hover:bg-[#eae1d2] hover:text-[#1c1917]"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-[#61574b]">
              Nous utilisons des cookies essentiels au bon fonctionnement de votre espace réservation et de votre session sécurisée. Aucune donnée n'est vendue à des tiers.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#8b652b]">
              <Link href="/politique-de-confidentialite" className="hover:underline">
                Politique de confidentialité
              </Link>
              <span>•</span>
              <Link href="/mentions-legales" className="hover:underline">
                Mentions légales
              </Link>
              <span>•</span>
              <Link href="/cgv" className="hover:underline">
                CGV
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleAccept}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1c1917] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-[#b7893b] hover:text-black"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Accepter tout</span>
              </button>

              <button
                onClick={handleDecline}
                className="inline-flex items-center justify-center rounded-full border border-[#cdae72]/50 bg-transparent px-4 py-2.5 text-xs font-semibold text-[#38322a] transition-all hover:bg-[#eae1d2]"
              >
                Essentiels uniquement
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
