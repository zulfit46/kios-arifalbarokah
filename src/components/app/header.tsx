"use client";

import { Menu, Search, Bell, ChevronDown, Sprout } from "lucide-react";
import { NAV_ITEMS, type ViewKey } from "./sidebar";

export function Header({
  active,
  onMenuClick,
}: {
  active: ViewKey;
  onMenuClick: () => void;
}) {
  const current = NAV_ITEMS.find((n) => n.key === active);
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenuClick}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground lg:hidden"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="min-w-0 flex-1 lg:flex-none">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {current?.label}
            </h1>
            <span className="hidden rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 sm:inline">
              {current?.desc}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative hidden md:block ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari petani, poktan, KTP..."
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Notifications */}
        <button
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent md:ml-0 ml-auto"
          aria-label="Notifikasi"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-card" />
        </button>

        {/* User */}
        <button className="flex items-center gap-2.5 rounded-xl border border-border bg-card py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-accent">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
            <Sprout className="h-4 w-4" />
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-[13px] font-semibold text-foreground">
              Kios ARIF AL BAROKA
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Pengecer Resmi
            </span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
        </button>
      </div>
    </header>
  );
}
