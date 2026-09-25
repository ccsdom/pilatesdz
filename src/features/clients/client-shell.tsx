"use client";
import { useCrmRole } from "@/features/auth/crm-role";

import Link from "next/link";
import { UsersRound, LayoutDashboard, KeyRound, CalendarDays, BookmarkCheck, WalletCards, CreditCard } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { CrmHeader } from "@/features/crm/crm-header";

export function ClientShell({ centerId, children, active = "clients" }: { centerId: string; children: React.ReactNode; active?: "dashboard" | "clients" | "planning" | "reservations" | "packages" | "cash" | "access" | "opening" }) {
  const role = useCrmRole();
  const itemClass = (selected: boolean) => `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${selected ? "bg-[#b7893b] text-black font-semibold shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"}`;

  const mobileNavItems = [
    { href: "/crm", label: "Accueil", icon: LayoutDashboard, key: "dashboard" },
    { href: "/crm/planning", label: "Planning", icon: CalendarDays, key: "planning" },
    { href: "/crm/clientes", label: "Clientes", icon: UsersRound, key: "clients" },
    { href: "/crm/forfaits", label: "Forfaits", icon: WalletCards, key: "packages" },
    { href: "/crm/encaissements", label: "Espèces", icon: CreditCard, key: "cash" },
  ];

  return (
    <div className="min-h-screen bg-[#f3eee5] text-[#1c1b19] dark:bg-[#0f0e0c] dark:text-[#f4ede2] lg:flex">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden bg-[#080808] dark:bg-[#0a0908] p-5 text-white lg:block lg:w-64 lg:shrink-0 border-r border-white/5">
        <div className="border-b border-white/10 pb-5">
          <BrandLockup light compact />
        </div>
        <nav aria-label="Navigation CRM" className="mt-5 flex flex-col gap-1.5">
          <Link href="/crm" aria-current={active === "dashboard" ? "page" : undefined} className={itemClass(active === "dashboard")}><LayoutDashboard size={18} />Tableau de bord</Link>
          <Link href="/crm/planning" aria-current={active === "planning" ? "page" : undefined} className={itemClass(active === "planning")}><CalendarDays size={18} />Planning</Link>
          <Link href="/crm/reservations" aria-current={active === "reservations" ? "page" : undefined} className={itemClass(active === "reservations")}><BookmarkCheck size={18} />Réservations</Link>
          <Link href="/crm/forfaits" aria-current={active === "packages" ? "page" : undefined} className={itemClass(active === "packages")}><WalletCards size={18} />Forfaits</Link>
          <Link href="/crm/encaissements" aria-current={active === "cash" ? "page" : undefined} className={itemClass(active === "cash")}><CreditCard size={18} />Encaissements</Link>
          <Link href="/crm/clientes" aria-current={active === "clients" ? "page" : undefined} className={itemClass(active === "clients")}><UsersRound size={18} />Clientes</Link>
          <Link href="/crm/horaires" aria-current={active === "opening" ? "page" : undefined} className={itemClass(active === "opening")}><CalendarDays size={18} />Horaires du centre</Link>
          {(role === "admin" || role === "manager") && <Link href="/crm/acces" aria-current={active === "access" ? "page" : undefined} className={itemClass(active === "access")}><KeyRound size={18} />Gestion des accès</Link>}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex flex-col pb-20 lg:pb-0">
        <CrmHeader centerId={centerId} title={active === "dashboard" ? "Tableau de bord" : undefined} />
        <main className="mx-auto min-w-0 max-w-6xl w-full space-y-7 px-4 py-6 sm:px-7 flex-1">{children}</main>
      </div>

      {/* Native Mobile Bottom Navigation Bar for Managers (CRM) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden pb-[env(safe-area-inset-bottom)]">
        <nav
          aria-label="Navigation CRM Mobile"
          className="mx-3 mb-2 flex items-center justify-around rounded-2xl border border-white/10 bg-[#0c0a09]/95 px-2 py-2 text-white shadow-2xl backdrop-blur-xl"
        >
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isSelected = active === item.key;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95 ${
                  isSelected ? "text-[#e5be78] font-semibold bg-white/10" : "text-white/60 hover:text-white"
                }`}
              >
                <Icon className={`h-5 w-5 ${isSelected ? "text-[#e5be78] scale-110" : ""}`} />
                <span className="text-[10px] mt-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
