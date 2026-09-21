"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  Phone, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  User, 
  ChevronRight
} from "lucide-react";
import { BrandLockup } from "./brand-lockup";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "/studio", label: "Le Studio", active: pathname === "/studio" || pathname === "/le-studio" },
    { href: "/pratiques", label: "Nos Pratiques", active: pathname === "/pratiques" || pathname === "/nos-pratiques" },
    { href: "/horaires", label: "Horaires", active: pathname === "/horaires" },
    { href: "/tarifs", label: "Tarifs", active: pathname === "/tarifs" },
    { href: "/contact", label: "Contact", active: pathname === "/contact" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#e7dac8]/60 bg-[#faf7f2]/90 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-6 lg:px-10">
          <BrandLockup compact />

          {/* Desktop Navigation */}
          <nav aria-label="Navigation principale" className="hidden items-center gap-8 text-xs font-medium uppercase tracking-[0.2em] text-[#524b42] lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-[#99702d] ${link.active ? "text-[#99702d] font-semibold" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action Buttons & Mobile Menu Trigger */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <a
              href="tel:0553021714"
              className="hidden items-center gap-2 rounded-full border border-[#cdae72]/50 bg-white/60 px-3.5 py-2 text-xs font-semibold tracking-wider text-[#38322a] transition-all hover:bg-[#f3e6d3] sm:inline-flex"
            >
              <Phone className="h-3.5 w-3.5 text-[#99702d]" />
              <span>05 53 02 17 14</span>
            </a>

            <Link
              href="/reservation"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#1c1917] px-4 py-2 sm:px-6 sm:py-2.5 text-xs font-semibold tracking-wider text-white shadow-md transition-all duration-300 hover:bg-[#b7893b] hover:text-black hover:shadow-xl hover:shadow-[#b7893b]/20 active:scale-95"
            >
              <span>Réserver</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#cdae72]/40 bg-white/80 text-[#1c1917] shadow-xs active:scale-90 transition-all lg:hidden"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-[#b7893b]" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* FULL-SCREEN MOBILE NAVIGATION DRAWER (Native App Experience) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0c0a09]/95 text-white backdrop-blur-2xl animate-fadeIn lg:hidden overflow-y-auto">
          {/* Drawer Top Bar */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <BrandLockup light compact />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white active:scale-90 transition-all"
              aria-label="Fermer"
            >
              <X className="h-5 w-5 text-[#e5be78]" />
            </button>
          </div>

          {/* Drawer Content Area */}
          <div className="flex-1 px-6 py-6 space-y-6">
            
            {/* Quick Location & Status Badge */}
            <div className="rounded-2xl border border-[#b7893b]/30 bg-gradient-to-r from-[#b7893b]/15 to-transparent p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b7893b]/20 text-[#e5be78]">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Pilates Center Alger</div>
                  <div className="text-[11px] text-white/60">Bir Mourad Raïs • Centre Zemzem</div>
                </div>
              </div>
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Navigation Links */}
            <nav aria-label="Navigation mobile" className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#e5be78] px-2 mb-3">
                Menu du Studio
              </div>

              <Link
                href="/"
                className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-medium transition-all ${
                  pathname === "/" ? "bg-[#b7893b] text-black font-semibold shadow-lg" : "bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                <span>Accueil</span>
                <ChevronRight className="h-4 w-4 opacity-70" />
              </Link>

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-medium transition-all ${
                    link.active ? "bg-[#b7893b] text-black font-semibold shadow-lg" : "bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  <span>{link.label}</span>
                  <ChevronRight className="h-4 w-4 opacity-70" />
                </Link>
              ))}

              <Link
                href="/connexion"
                className="flex items-center justify-between rounded-2xl border border-[#b7893b]/40 bg-[#171412] px-4 py-3.5 text-base font-medium text-[#e5be78] hover:bg-[#b7893b]/20 transition-all mt-4"
              >
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-[#e5be78]" />
                  <span>Espace Cliente & Connexion</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </nav>

            {/* Quick Contact & Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <Link
                href="/reservation"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b7893b] py-4 text-sm font-bold text-black shadow-xl shadow-[#b7893b]/25 active:scale-[0.98] transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>Réserver un Cours en Ligne</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="tel:0553021714"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-3.5 text-sm font-semibold text-white hover:bg-white/20 active:scale-[0.98] transition-all"
              >
                <Phone className="h-4 w-4 text-[#e5be78]" />
                <span>Appeler le studio : 05 53 02 17 14</span>
              </a>
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/40">
            © Pilates Center Alger • Force, Équilibre & Harmonie
          </div>
        </div>
      )}
    </>
  );
}
