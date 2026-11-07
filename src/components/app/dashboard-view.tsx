"use client";

import {
  Users,
  Wheat,
  Layers,
  Sprout,
  Leaf,
  FlaskConical,
  Recycle,
  CloudRain,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStats } from "@/hooks/use-petani";
import { StatCard } from "./stat-card";
import { formatHa, formatNumber } from "@/lib/format";

const PIE_COLORS = ["#0ea968", "#d97706", "#65a30d", "#0891b2", "#dc2626", "#7c3aed"];

const PUPUK_META = [
  { key: "totalUrea", label: "Urea", icon: FlaskConical, color: "bg-sky-50 text-sky-700", bar: "bg-sky-500" },
  { key: "totalNpk", label: "NPK", icon: FlaskConical, color: "bg-violet-50 text-violet-700", bar: "bg-violet-500" },
  { key: "totalNpkFormula", label: "NPK Formula", icon: FlaskConical, color: "bg-amber-50 text-amber-700", bar: "bg-amber-500" },
  { key: "totalOrganik", label: "Organik", icon: Recycle, color: "bg-lime-50 text-lime-700", bar: "bg-lime-600" },
  { key: "totalZa", label: "ZA", icon: CloudRain, color: "bg-rose-50 text-rose-700", bar: "bg-rose-500" },
] as const;

function SectionCard({
  title,
  desc,
  children,
  right,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {desc && <p className="mt-0.5 text-[13px] text-muted-foreground">{desc}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function DashboardView() {
  const { data: stats, isLoading } = useStats();

  if (isLoading || !stats) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted/60" />
        ))}
        <div className="h-72 animate-pulse rounded-2xl bg-muted/60 sm:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    );
  }

  const totalPupuk =
    stats.totalUrea + stats.totalNpk + stats.totalNpkFormula + stats.totalOrganik + stats.totalZa;

  const musimData = stats.pupukPerMusim.map((m) => ({
    musim: m.musim,
    Urea: m.urea,
    NPK: m.npk,
    "NPK Formula": m.npkFormula,
    Organik: m.organik,
    ZA: m.za,
  }));

  const maxPupuk = Math.max(...PUPUK_META.map((p) => stats[p.key as keyof typeof stats] as number));

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white shadow-soft sm:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold ring-1 ring-white/25">
              <Leaf className="h-3.5 w-3.5" /> Kios Pengecer Resmi
            </span>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
              Selamat Datang, Kios ARIF AL BAROKA
            </h2>
            <p className="mt-2 text-sm text-white/80">
              Rekapitulasi penjualan pupuk bersubsidi musim tanam berjalan.
              Pantau kuota, data petani, dan distribusi pupuk secara real-time.
            </p>
            <div className="mt-5 flex flex-wrap gap-6">
              <div>
                <p className="text-3xl font-extrabold">{formatNumber(stats.totalPetani)}</p>
                <p className="text-xs text-white/70">Total Petani Terdaftar</p>
              </div>
              <div className="border-l border-white/20 pl-6">
                <p className="text-3xl font-extrabold">{formatNumber(stats.totalPoktan)}</p>
                <p className="text-xs text-white/70">Kelompok Tani (Poktan)</p>
              </div>
              <div className="border-l border-white/20 pl-6">
                <p className="text-3xl font-extrabold">{formatNumber(Math.round(totalPupuk))}</p>
                <p className="text-xs text-white/70">Total Alokasi Pupuk (Kg)</p>
              </div>
            </div>
          </div>
          <div className="hidden shrink-0 md:block">
            <div className="grid h-28 w-28 place-items-center rounded-3xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <Sprout className="h-14 w-14 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Petani"
          value={formatNumber(stats.totalPetani)}
          unit="orang"
          icon={Users}
          tone="emerald"
          hint="Terdaftar di kios pengecer"
        />
        <StatCard
          label="Total Poktan"
          value={formatNumber(stats.totalPoktan)}
          unit="kelompok"
          icon={Leaf}
          tone="teal"
          hint="Kelompok tani aktif"
        />
        <StatCard
          label="Total Luas Lahan"
          value={formatNumber(stats.totalLuasLahan, 2)}
          unit="Ha"
          icon={Layers}
          tone="lime"
          hint="Gabungan 3 musim tanam"
        />
        <StatCard
          label="Total Alokasi Pupuk"
          value={formatNumber(Math.round(totalPupuk))}
          unit="Kg"
          icon={Wheat}
          tone="amber"
          hint="Seluruh jenis pupuk"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionCard
            title="Distribusi Pupuk per Musim Tanam"
            desc="Alokasi pupuk (Kg) untuk setiap musim MT1–MT3"
            right={
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <TrendingUp className="h-3.5 w-3.5" /> 3 Musim
              </span>
            }
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={musimData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="musim" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip
                    cursor={{ fill: "rgba(16,185,129,0.06)" }}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(v: number) => `${formatNumber(v)} Kg`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                  <Bar dataKey="Urea" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="NPK" stackId="a" fill="#8b5cf6" />
                  <Bar dataKey="NPK Formula" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Organik" stackId="a" fill="#65a30d" />
                  <Bar dataKey="ZA" stackId="a" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
              {stats.pupukPerMusim.map((m, i) => {
                const t = m.urea + m.npk + m.npkFormula + m.organik + m.za;
                const labels = ["Musim Tanam 1", "Musim Tanam 2", "Musim Tanam 3"];
                const tones = ["text-emerald-700 bg-emerald-50", "text-teal-700 bg-teal-50", "text-cyan-700 bg-cyan-50"];
                return (
                  <div key={m.musim} className="rounded-xl border border-border px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tones[i]}`}>{m.musim}</span>
                      <span className="truncate text-[11px] font-medium text-muted-foreground">{labels[i]}</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-foreground">
                      {t > 0 ? `${formatNumber(Math.round(t))} Kg` : "Belum ada alokasi"}
                    </p>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard
            title="Distribusi Subsektor"
            desc="Komposisi petani berdasarkan subsektor"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.bySubsektor}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {stats.bySubsektor.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(v: number, n: string) => [`${formatNumber(v)} petani`, n]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Pupuk breakdown + Top poktan */}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionCard
            title="Rincian Alokasi per Jenis Pupuk"
            desc="Total alokasi pupuk bersubsidi (Kg)"
          >
            <div className="space-y-4">
              {PUPUK_META.map((p) => {
                const val = stats[p.key as keyof typeof stats] as number;
                const pct = maxPupuk > 0 ? (val / maxPupuk) * 100 : 0;
                const Icon = p.icon;
                return (
                  <div key={p.key}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`grid h-8 w-8 place-items-center rounded-lg ${p.color}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-semibold text-foreground">{p.label}</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">
                        {formatNumber(Math.round(val))} <span className="text-xs font-medium text-muted-foreground">Kg</span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${p.bar} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard
            title="Top Poktan"
            desc="Kelompok tani dengan petani terbanyak"
          >
            <div className="max-h-80 space-y-1 overflow-y-auto scroll-thin pr-1">
              {stats.byPoktan.slice(0, 8).map((p, i) => {
                const pct = stats.totalPetani > 0 ? (p.petani / stats.totalPetani) * 100 : 0;
                return (
                  <div key={p.name} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent/60">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{p.petani}</p>
                      <p className="text-[10px] text-muted-foreground">{formatHa(p.luas)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Komoditas chips */}
      <SectionCard title="Sebaran Komoditas" desc="Jumlah petani per komoditas utama">
        <div className="flex flex-wrap gap-2.5">
          {stats.byKomoditas.map((k, i) => (
            <span
              key={k.name}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-2 pr-3 text-sm shadow-sm"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="font-semibold text-foreground">{k.name}</span>
              <span className="text-xs text-muted-foreground">{k.value} petani</span>
            </span>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
