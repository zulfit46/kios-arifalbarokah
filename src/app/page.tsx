"use client";

import { useState } from "react";
import { Sidebar, MobileSidebar, type ViewKey } from "@/components/app/sidebar";
import { Header } from "@/components/app/header";
import { DashboardView } from "@/components/app/dashboard-view";
import { DataPetaniView } from "@/components/app/data-petani-view";
import { KuotaPetaniView } from "@/components/app/kuota-petani-view";
import { PenyaluranView } from "@/components/app/penyaluran-view";
import { SisaKuotaView } from "@/components/app/sisa-kuota-view";
import { LaporanView } from "@/components/app/laporan-view";
import { Sprout, Mail, Phone, MapPin } from "lucide-react";

export default function Home() {
  const [view, setView] = useState<ViewKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar active={view} onSelect={setView} />
      <MobileSidebar
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        active={view}
        onSelect={setView}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header active={view} onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div key={view} className="animate-fade-up">
            {view === "dashboard" && <DashboardView />}
            {view === "data-petani" && <DataPetaniView />}
            {view === "kuota-petani" && <KuotaPetaniView />}
            {view === "penyaluran" && <PenyaluranView />}
            {view === "sisa-kuota" && <SisaKuotaView />}
            {view === "laporan" && <LaporanView />}
          </div>
        </main>

        <footer className="mt-auto border-t border-border bg-card">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
                <Sprout className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold text-foreground">Kios Pengecer ARIF AL BAROKA</p>
                <p className="text-[11px] text-muted-foreground">
                  Sistem Informasi Penjualan Pupuk Bersubsidi
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Kab. Luwu, Sulawesi Selatan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Kantor Penyuluh
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> arifalbaroka@pupuk-subsidi.id
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
