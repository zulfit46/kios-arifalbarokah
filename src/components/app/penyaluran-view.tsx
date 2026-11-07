"use client";

import { useMemo, useState } from "react";
import { Search, Truck, ChevronLeft, ChevronRight, FileX2, Users, Package, CalendarDays, Leaf } from "lucide-react";
import { usePenyaluran } from "@/hooks/use-petani";
import { formatNumber } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 10;

const BULAN_NAMES: Record<string, string> = {
  "1": "Januari",
  "2": "Februari",
  "3": "Maret",
  "4": "April",
  "5": "Mei",
  "6": "Juni",
  "7": "Juli",
  "8": "Agustus",
  "9": "September",
  "10": "Oktober",
  "11": "November",
  "12": "Desember",
};

function bulanLabel(b: string): string {
  return BULAN_NAMES[b] || b;
}

/** Format date "28-08-2026" -> "28 Agustus 2026" */
function formatDateID(s: string): string {
  if (!s) return "-";
  const parts = s.split(/[-/]/);
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${d} ${bulanLabel(m)} ${y}`;
  }
  return s;
}

function num(v: number) {
  return v > 0 ? formatNumber(Math.round(v)) : "-";
}

export function PenyaluranView() {
  const { data, isLoading } = usePenyaluran();
  const [q, setQ] = useState("");
  const [poktan, setPoktan] = useState("all");
  const [bulan, setBulan] = useState("all");
  const [page, setPage] = useState(1);

  const poktanList = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((d) => d.poktan).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "id", { sensitivity: "base" })
    );
  }, [data]);

  const bulanList = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.map((d) => d.bulan).filter(Boolean));
    return [...set].sort((a, b) => Number(a) - Number(b));
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    return data.filter((d) => {
      if (poktan !== "all" && d.poktan.toLowerCase() !== poktan.toLowerCase()) return false;
      if (bulan !== "all" && d.bulan !== bulan) return false;
      if (!term) return true;
      return (
        d.nama.toLowerCase().includes(term) ||
        d.nik.toLowerCase().includes(term) ||
        d.poktan.toLowerCase().includes(term)
      );
    });
  }, [data, q, poktan, bulan]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totals = useMemo(() => {
    let urea = 0, npk = 0, nf = 0, o = 0;
    const poktanSet = new Set<string>();
    const nikSet = new Set<string>();
    for (const d of filtered) {
      urea += d.urea;
      npk += d.npk;
      nf += d.npkFormulaKhusus;
      o += d.organik;
      if (d.poktan) poktanSet.add(d.poktan);
      if (d.nik) nikSet.add(d.nik);
    }
    return { urea, npk, nf, o, total: urea + npk + nf + o, poktanCount: poktanSet.size, petaniCount: nikSet.size };
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Users className="h-5 w-5" /></span>
            <div>
              <p className="text-xs text-muted-foreground">Total Transaksi</p>
              <p className="text-xl font-extrabold text-foreground">{filtered.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Leaf className="h-5 w-5" /></span>
            <div>
              <p className="text-xs text-muted-foreground">Jumlah Poktan</p>
              <p className="text-xl font-extrabold text-foreground">{totals.poktanCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-50 text-lime-700"><Users className="h-5 w-5" /></span>
            <div>
              <p className="text-xs text-muted-foreground">Jumlah Petani (unik per NIK)</p>
              <p className="text-xl font-extrabold text-foreground">{totals.petaniCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><CalendarDays className="h-5 w-5" /></span>
            <div>
              <p className="text-xs text-muted-foreground">Periode Aktif</p>
              <p className="text-xl font-extrabold text-foreground">
                {bulan !== "all" ? `Bln ${bulanLabel(bulan)}` : `${bulanList.length} bulan`}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Package className="h-5 w-5" /></span>
            <div>
              <p className="text-xs text-muted-foreground">Total Pupuk Ditebus</p>
              <p className="text-xl font-extrabold text-foreground">{formatNumber(totals.total)} <span className="text-xs font-medium text-muted-foreground">Kg</span></p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Rincian (Kg):</span>
            <span className="text-xs font-semibold text-sky-700">Urea {formatNumber(totals.urea)}</span>
            <span className="text-xs font-semibold text-violet-700">NPK {formatNumber(totals.npk)}</span>
            <span className="text-xs font-semibold text-amber-700">NPK Form. {formatNumber(totals.nf)}</span>
            <span className="text-xs font-semibold text-lime-700">Organik {formatNumber(totals.o)}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Cari nama, NIK, poktan..."
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="w-full sm:w-52">
            <Select value={poktan} onValueChange={(v) => { setPoktan(v); setPage(1); }}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Semua Poktan" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">Semua Poktan</SelectItem>
                {poktanList.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select value={bulan} onValueChange={(v) => { setBulan(v); setPage(1); }}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Semua Bulan" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">Semua Bulan</SelectItem>
                {bulanList.map((b) => <SelectItem key={b} value={b}>Bulan {bulanLabel(b)} ({b})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">No</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">NIK</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Poktan</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tanggal Tebus</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Urea (Kg)</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">NPK (Kg)</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">NPK Formula Khusus (Kg)</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organik (Kg)</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bulan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-3.5 animate-pulse rounded bg-muted/70" /></td>
                    ))}
                  </tr>
                ))
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted"><FileX2 className="h-7 w-7 text-muted-foreground" /></span>
                      <p className="text-sm font-semibold text-foreground">Tidak ada data ditemukan</p>
                      <p className="max-w-xs text-xs text-muted-foreground">Coba ubah kata kunci pencarian atau filter yang dipilih.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((d, i) => (
                  <tr key={i} className="transition-colors hover:bg-accent/40">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{d.nama}</td>
                    <td className="px-4 py-3"><span className="font-mono text-xs text-muted-foreground">{d.nik || "-"}</span></td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{d.poktan || "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateID(d.tanggalTebus)}</td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-sky-700">{num(d.urea)}</td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-violet-700">{num(d.npk)}</td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-amber-700">{num(d.npkFormulaKhusus)}</td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-lime-700">{num(d.organik)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
                        <CalendarDays className="h-3 w-3" /> {bulanLabel(d.bulan)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/50">
                  <td colSpan={5} className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-700" />
                      <span className="text-sm font-extrabold uppercase tracking-wide text-foreground">Total</span>
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">{filtered.length} transaksi</span>
                      {poktan !== "all" && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Poktan: {poktan}</span>}
                      {bulan !== "all" && <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">Bulan: {bulanLabel(bulan)}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right text-xs font-extrabold text-sky-700">{num(totals.urea)}</td>
                  <td className="px-4 py-3.5 text-right text-xs font-extrabold text-violet-700">{num(totals.npk)}</td>
                  <td className="px-4 py-3.5 text-right text-xs font-extrabold text-amber-700">{num(totals.nf)}</td>
                  <td className="px-4 py-3.5 text-right text-xs font-extrabold text-lime-700">{num(totals.o)}</td>
                  <td className="px-4 py-3.5 text-right text-xs font-bold text-foreground">
                    {formatNumber(totals.total)} <span className="text-[10px] font-medium text-muted-foreground">Kg</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3.5 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Menampilkan{" "}
            <span className="font-semibold text-foreground">
              {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
            </span>{" "}
            dari <span className="font-semibold text-foreground">{filtered.length}</span> transaksi
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">{safePage} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
