"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, Clock, Tag, Compass } from "lucide-react";

export function PublicMobileBottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on CRM or Espace Cliente routes to avoid cluttering back-office interfaces
  if (pathname.startsWith("/crm") || pathname.startsWith("/espace-cliente") || pathname.startsWith("/connexion")) {
    return null;
  }

  const navItems = [
    { href: "/", label: "Accueil", icon: Home, active: pathname === "/" },
    { href: "/studio", label: "Studio", icon: Compass, active: pathname === "/studio" || pathname === "/le-studio" },
    { href: "/horaires", label: "Horaires", icon: Clock, active: pathname === "/horaires" },
    { href: "/tarifs", label: "Tarifs", icon: Tag, active: pathname === "/tarifs" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 block md:hidden pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <nav 
        aria-label="Navigation mobile inférieure"
        className="pointer-events-auto mx-2 mb-3 flex items-center justify-between rounded-full border border-white/20 bg-[#0c0a09]/90 px-2 py-2 text-white shadow-2xl backdrop-blur-xl transition-all"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-full transition-all active:scale-90 ${
                item.active ? "text-[#e5be78] font-semibold" : "text-white/60 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${item.active ? "text-[#e5be78] scale-110" : ""}`} />
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Highlighted Floating Action Button for Reservation */}
        <Link
          href="/reservation"
          className="group flex items-center gap-1.5 rounded-full bg-[#b7893b] px-3 py-2.5 text-xs font-bold text-black shadow-lg shadow-[#b7893b]/30 active:scale-95 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          <span>Réserver</span>
        </Link>
      </nav>
    </div>
  );
}
