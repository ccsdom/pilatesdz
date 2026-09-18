"use client";

import * as React from "react";
import Link from "next/link";
import {
  Settings,
  User,
  ShieldCheck,
  KeyRound,
  WalletCards,
  Receipt,
  Clock,
  ChevronDown,
  Building2,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/features/auth/logout-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface CrmHeaderProps {
  centerId?: string;
  title?: string;
  subtitle?: string;
}

export function CrmHeader({
  centerId = "alger",
  title = "Administration",
  subtitle = "Pilates Center Alger",
}: CrmHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-border/80 bg-background/95 px-5 py-3.5 backdrop-blur-md transition-colors dark:bg-[#151310]/95 dark:border-[#2e2a24]">
      {/* Left side: Center branding & page context */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b7893b]/10 text-[#b7893b] dark:bg-[#d5ae65]/15 dark:text-[#d5ae65]">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-base font-semibold tracking-wide text-foreground">
              {subtitle}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {centerId ? `Centre ${centerId.toUpperCase()}` : "Alger"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {title} · Heure d'Alger (UTC+1)
          </p>
        </div>
      </div>

      {/* Right side: Actions (Mode Clair/Sombre, Paramètres, Profil) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mode Clair / Sombre */}
        <ThemeToggle />

        {/* Paramètres Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-border/60 bg-background/80 hover:bg-accent hover:text-accent-foreground transition-all shadow-xs"
              aria-label="Paramètres du CRM"
            >
              <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5 shadow-lg">
            <DropdownMenuLabel className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#b7893b]" />
              Paramètres du CRM
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href="/crm/acces"
                  className="flex items-center gap-2.5 px-2.5 py-2 text-sm cursor-pointer rounded-lg"
                >
                  <KeyRound className="h-4 w-4 text-[#b7893b]" />
                  <div className="flex flex-col">
                    <span className="font-medium">Gestion des accès</span>
                    <span className="text-xs text-muted-foreground">Admins et autorisations</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/crm/forfaits/suivi"
                  className="flex items-center gap-2.5 px-2.5 py-2 text-sm cursor-pointer rounded-lg"
                >
                  <WalletCards className="h-4 w-4 text-[#b7893b]" />
                  <div className="flex flex-col">
                    <span className="font-medium">Suivi des forfaits</span>
                    <span className="text-xs text-muted-foreground">Échéances & crédits faibles</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/crm/encaissements/soldes"
                  className="flex items-center gap-2.5 px-2.5 py-2 text-sm cursor-pointer rounded-lg"
                >
                  <Receipt className="h-4 w-4 text-[#b7893b]" />
                  <div className="flex flex-col">
                    <span className="font-medium">Soldes à vérifier</span>
                    <span className="text-xs text-muted-foreground">Encaissements & impayés</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/crm/presences"
                  className="flex items-center gap-2.5 px-2.5 py-2 text-sm cursor-pointer rounded-lg"
                >
                  <Clock className="h-4 w-4 text-[#b7893b]" />
                  <div className="flex flex-col">
                    <span className="font-medium">Suivi des présences</span>
                    <span className="text-xs text-muted-foreground">Pointages et validations</span>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-[11px] text-muted-foreground/80 flex items-center justify-between">
              <span>Studio: {centerId.toUpperCase()}</span>
              <span>v1.2.0</span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profil Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-9 px-3 rounded-full border-border/60 bg-background/80 hover:bg-accent transition-all shadow-xs"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#b7893b] text-[11px] font-bold text-black shadow-xs">
                A
              </div>
              <span className="hidden text-xs font-medium sm:inline-block text-foreground">
                Admin
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5 shadow-lg">
            <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b7893b] text-sm font-bold text-black">
                AD
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-foreground">Administrateur</p>
                <p className="text-xs text-muted-foreground truncate">Pilates Center Alger</p>
                <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-[#b7893b]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#b7893b]">
                  <ShieldCheck className="h-3 w-3" /> Accès complet
                </span>
              </div>
            </div>
            <DropdownMenuGroup className="mt-1">
              <DropdownMenuItem asChild>
                <Link
                  href="/crm/acces"
                  className="flex items-center gap-2 px-2.5 py-2 text-sm cursor-pointer rounded-lg"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Mon profil & droits</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/espace-cliente"
                  target="_blank"
                  className="flex items-center justify-between px-2.5 py-2 text-sm cursor-pointer rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Vue Espace Cliente</span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="p-1">
              <LogoutButton />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
