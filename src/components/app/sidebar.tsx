"use client";

import { LayoutDashboard, Users, Wheat, Sprout, X, ShieldCheck, FileText, Truck, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewKey = "dashboard" | "data-petani" | "kuota-petani" | "penyaluran" | "sisa-kuota" | "laporan";

export const NAV_ITEMS: {
  key: ViewKey;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "dashboard", label: "Dashboard", desc: "Ringkasan & statistik", icon: LayoutDashboard },
  { key: "data-petani", label: "Data Petani", desc: "Daftar seluruh petani", icon: Users },
  { key: "kuota-petani", label: "Kuota Petani", desc: "Alokasi pupuk per musim", icon: Wheat },
  { key: "penyaluran", label: "Penyaluran", desc: "Realisasi tebus pupuk", icon: Truck },
  { key: "sisa-kuota", label: "Sisa Kuota", desc: "Kuota - realisasi tebus", icon: Scale },
  { key: "laporan", label: "Laporan", desc: "Rekap per poktan + PDF", icon: FileText },
];

function SidebarContent({
  active,
  onSelect,
}: {
  active: ViewKey;
  onSelect: (v: ViewKey) => void;
}) {
  return (
    <div className="sidebar-gradient flex h-full flex-col text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 pt-7 pb-6">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
          <Sprout className="h-6 w-6 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-extrabold tracking-tight">ARIF AL BAROKA</p>
          <p className="text-[11px] font-medium text-white/70">Pupuk Bersubsidi</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-4 flex-1">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          Menu Utama
        </p>
        <ul className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <li key={item.key}>
                <button
                  onClick={() => onSelect(item.key)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                    isActive
                      ? "bg-white text-emerald-900 shadow-lg shadow-emerald-950/20"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors",
                      isActive
                        ? "bg-emerald-600/10 text-emerald-700"
                        : "bg-white/10 text-white/80 group-hover:bg-white/15"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "block truncate text-[11px] leading-tight",
                        isActive ? "text-emerald-700/70" : "text-white/50"
                      )}
                    >
                      {item.desc}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom promo card */}
      <div className="p-4">
        <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-200" />
            <p className="text-xs font-semibold text-white">Resmi & Terdaftar</p>
          </div>
          <p className="text-[11px] leading-relaxed text-white/70">
            Kios Pengecer Resmi pupuk bersubsidi. Data terverifikasi sesuai
            Rencana Definitif Kebutuhan Kelompok (RDKK).
          </p>
        </div>
        <p className="mt-4 px-2 text-center text-[10px] text-white/40">
          © {new Date().getFullYear()} Kios ARIF AL BAROKA
        </p>
      </div>
    </div>
  );
}

export function Sidebar({
  active,
  onSelect,
}: {
  active: ViewKey;
  onSelect: (v: ViewKey) => void;
}) {
  return (
    <aside className="hidden lg:block w-[264px] shrink-0 sticky top-0 h-screen">
      <SidebarContent active={active} onSelect={onSelect} />
    </aside>
  );
}

export function MobileSidebar({
  open,
  onOpenChange,
  active,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  active: ViewKey;
  onSelect: (v: ViewKey) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="absolute left-0 top-0 h-full w-[280px] shadow-2xl">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"
          aria-label="Tutup menu"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent
          active={active}
          onSelect={(v) => {
            onSelect(v);
            onOpenChange(false);
          }}
        />
      </div>
    </div>
  );
}
