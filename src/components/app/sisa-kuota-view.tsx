"use client";

import { Fragment, useMemo, useState } from "react";
import { Search, Scale, ChevronLeft, ChevronRight, FileX2, Users, Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { usePenyaluran, usePetani } from "@/hooks/use-petani";
import { formatNumber } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Petani, Penyaluran } from "@/lib/types";

const PAGE_SIZE = 10;

interface SisaKuotaRow {
  nik: string;
  nama: string;
  poktan: string;
  poktanList: string[];
  // Kuota = MT1 + MT2
  kuotaUrea: number;
  kuotaNpk: number;
  kuotaNpkFormula: number;
  kuotaOrganik: number;
  // Ditebus = sum penyaluran
  tebusUrea: number;
  tebusNpk: number;
  tebusNpkFormula: number;
  tebusOrganik: number;
  // Sisa = kuota - ditebus
  sisaUrea: number;
  sisaNpk: number;
  sisaNpkFormula: number;
  sisaOrganik: number;
  transaksiCount: number;
}

function num(v: number) {
  return v > 0 ? formatNumber(Math.round(v)) : v < 0 ? formatNumber(Math.round(v)) : "-";
}

/** Build sisa kuota rows — one row per (NIK + Poktan) combination from petani sheet (962 rows).
 *  Realisasi tebus (penyaluran, per NIK) dialokasikan proporsional ke setiap poktan
 *  berdasarkan proporsi kuota petani tersebut terhadap total kuota NIK. */
function buildSisaKuota(petani: Petani[], penyaluran: Penyaluran[]): SisaKuotaRow[] {
  // 1) Kuota per baris petani (NIK + Poktan), MT1 + MT2
  const kuotaByNik = new Map<string, {
    totalUrea: number; totalNpk: number; totalNf: number; totalO: number;
    rows: Array<{ nik: string; nama: string; poktan: string; urea: number; npk: number; nf: number; o: number; }>;
  }>();
  for (const p of petani) {
    const nik = p.ktp.replace(/`/g, "").trim();
    if (!nik) continue;
    const poktan = (p.namaPoktan || "(Tanpa Poktan)").trim();
    const urea = p.pupukUreaMT1 + p.pupukUreaMT2;
    const npk = p.pupukNpkMT1 + p.pupukNpkMT2;
    const nf = p.pupukNpkFormulaMT1 + p.pupukNpkFormulaMT2;
    const o = p.pupukOrganikMT1 + p.pupukOrganikMT2;
    let e = kuotaByNik.get(nik);
    if (!e) {
      e = { totalUrea: 0, totalNpk: 0, totalNf: 0, totalO: 0, rows: [] };
      kuotaByNik.set(nik, e);
    }
    e.totalUrea += urea; e.totalNpk += npk; e.totalNf += nf; e.totalO += o;
    e.rows.push({ nik, nama: p.namaPetani, poktan, urea, npk, nf, o });
  }

  // 2) Realisasi tebus per NIK (dijumlahkan semua transaksi)
  const tebusByNik = new Map<string, { urea: number; npk: number; nf: number; o: number; count: number }>();
  for (const s of penyaluran) {
    const nik = s.nik.replace(/`/g, "").trim();
    if (!nik) continue;
    let e = tebusByNik.get(nik);
    if (!e) { e = { urea: 0, npk: 0, nf: 0, o: 0, count: 0 }; tebusByNik.set(nik, e); }
    e.urea += s.urea; e.npk += s.npk; e.nf += s.npkFormulaKhusus; e.o += s.organik; e.count += 1;
  }

  // 3) Bangun baris sisa kuota: tebus dialokasikan proporsional ke setiap poktan
  const rows: SisaKuotaRow[] = [];
  for (const [nik, k] of kuotaByNik) {
    const t = tebusByNik.get(nik);
    for (const row of k.rows) {
      // proporsi kuota baris ini terhadap total kuota NIK (per jenis pupuk)
      const ratio = (jenis: "urea" | "npk" | "nf" | "o") => {
        const tot = jenis === "urea" ? k.totalUrea : jenis === "npk" ? k.totalNpk : jenis === "nf" ? k.totalNf : k.totalO;
        return tot > 0 ? (jenis === "urea" ? row.urea : jenis === "npk" ? row.npk : jenis === "nf" ? row.nf : row.o) / tot : 0;
      };
      const tebusUrea = t ? t.urea * ratio("urea") : 0;
      const tebusNpk = t ? t.npk * ratio("npk") : 0;
      const tebusNf = t ? t.nf * ratio("nf") : 0;
      const tebusO = t ? t.o * ratio("o") : 0;
      rows.push({
        nik,
        nama: row.nama,
        poktan: row.poktan,
        poktanList: [row.poktan],
        kuotaUrea: row.urea,
        kuotaNpk: row.npk,
        kuotaNpkFormula: row.nf,
        kuotaOrganik: row.o,
        tebusUrea,
        tebusNpk,
        tebusNpkFormula: tebusNf,
        tebusOrganik: tebusO,
        sisaUrea: row.urea - tebusUrea,
        sisaNpk: row.npk - tebusNpk,
        sisaNpkFormula: row.nf - tebusNf,
        sisaOrganik: row.o - tebusO,
        transaksiCount: t?.count ?? 0,
      });
    }
  }
  rows.sort((a, b) => a.nama.localeCompare(b.nama, "id") || a.poktan.localeCompare(b.poktan, "id"));
  return rows;
}

export function SisaKuotaView() {
  const { data: petani } = usePetani();
  const { data: penyaluran } = usePenyaluran();
  const isLoading = !petani || !penyaluran;

  const [q, setQ] = useState("");
  const [poktan, setPoktan] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const allRows = useMemo(() => {
    if (!petani || !penyaluran) return [];
    return buildSisaKuota(petani, penyaluran);
  }, [petani, penyaluran]);

  const poktanList = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRows) for (const p of r.poktanList) set.add(p);
    return [...set].sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" }));
  }, [allRows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allRows.filter((r) => {
      if (poktan !== "all" && !r.poktanList.includes(poktan)) return false;
      // status: "all" | "habis" (sisa <= 0 semua) | "sisa" (masih ada sisa > 0) | "belum" (0 transaksi)
      const totalSisa = r.sisaUrea + r.sisaNpk + r.sisaNpkFormula + r.sisaOrganik;
      const totalTebus = r.tebusUrea + r.tebusNpk + r.tebusNpkFormula + r.tebusOrganik;
      if (status === "habis" && totalSisa > 0) return false;
      if (status === "sisa" && totalSisa <= 0) return false;
      if (status === "belum" && totalTebus > 0) return false;
      if (!term) return true;
      return (
        r.nama.toLowerCase().includes(term) ||
        r.nik.toLowerCase().includes(term) ||
        r.poktanList.some((p) => p.toLowerCase().includes(term))
      );
    });
  }, [allRows, q, poktan, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totals = useMemo(() => {
    let kU = 0, kN = 0, kNF = 0, kO = 0;
    let tU = 0, tN = 0, tNF = 0, tO = 0;
    let habisCount = 0;
    for (const r of filtered) {
      kU += r.kuotaUrea; kN += r.kuotaNpk; kNF += r.kuotaNpkFormula; kO += r.kuotaOrganik;
      tU += r.tebusUrea; tN += r.tebusNpk; tNF += r.tebusNpkFormula; tO += r.tebusOrganik;
      const totalSisa = r.sisaUrea + r.sisaNpk + r.sisaNpkFormula + r.sisaOrganik;
      if (totalSisa <= 0) habisCount += 1;
    }
    return {
      kuota: { urea: kU, npk: kN, nf: kNF, o: kO },
      tebus: { urea: tU, npk: tN, nf: tNF, o: tO },
      sisa: { urea: kU - tU, npk: kN - tN, nf: kNF - tNF, o: kO - tO },
      habisCount,
    };
  }, [filtered]);

  const numF = (v: number) => (v !== 0 ? formatNumber(Math.round(v)) : "-");

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Users className="h-5 w-5" /></span>
            <div>
              <p className="text-xs text-muted-foreground">Total Petani</p>
              <p className="text-xl font-extrabold text-foreground">{filtered.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Package className="h-5 w-5" /></span>
            <div>
              <p className="text-xs text-muted-foreground">Total Sisa Kuota</p>
              <p className="text-xl font-extrabold text-foreground">{formatNumber(totals.sisa.urea + totals.sisa.npk + totals.sisa.nf + totals.sisa.o)} <span className="text-xs font-medium text-muted-foreground">Kg</span></p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700"><AlertTriangle className="h-5 w-5" /></span>
            <div>
              <p className="text-xs text-muted-foreground">Kuota Habis / Minus</p>
              <p className="text-xl font-extrabold text-foreground">{totals.habisCount} <span className="text-xs font-medium text-muted-foreground">petani</span></p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><CheckCircle2 className="h-5 w-5" /></span>
            <div>
              <p className="text-xs text-muted-foreground">Masih Ada Sisa</p>
              <p className="text-xl font-extrabold text-foreground">{filtered.length - totals.habisCount} <span className="text-xs font-medium text-muted-foreground">petani</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Semua Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="sisa">Masih Ada Sisa</SelectItem>
                <SelectItem value="habis">Kuota Habis / Minus</SelectItem>
                <SelectItem value="belum">Belum Tebus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <Scale className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        <div className="text-sm">
          <p className="font-semibold text-emerald-900">Sisa Kuota Pupuk per Petani per Poktan</p>
          <p className="mt-0.5 text-[13px] text-emerald-800/80">
            Sisa kuota = <span className="font-semibold">Kuota (MT1 + MT2)</span> − <span className="font-semibold">Realisasi Tebus</span>, dihitung per petani per poktan (1 baris = 1 NIK + 1 Poktan, total 962 baris).
            Karena data penyaluran tidak mencantumkan poktan, realisasi tebus dialokasikan <span className="font-semibold">proporsional</span> ke setiap poktan berdasarkan proporsi kuota. Nilai <span className="font-semibold text-rose-700">merah</span> = kuota habis/minus, <span className="font-semibold text-amber-700">kuning</span> = sisa mendekati nol.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[1500px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">No</th>
                <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Petani</th>
                <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">NIK</th>
                <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Poktan</th>
                <th colSpan={4} className="border-r border-border bg-emerald-600/90 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Kuota (MT1 + MT2)</th>
                <th colSpan={4} className="border-r border-border bg-amber-600/90 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Realisasi Tebus</th>
                <th colSpan={4} className="bg-teal-700 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Sisa Kuota</th>
              </tr>
              <tr className="border-b border-border bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {Array.from({ length: 3 }).map((_, gi) => (
                  <Fragment key={gi}>
                    <th className="border-r border-border px-3 py-2 text-right">Urea</th>
                    <th className="border-r border-border px-3 py-2 text-right">NPK</th>
                    <th className="border-r border-border px-3 py-2 text-right">NPK Form.</th>
                    <th className="border-r border-border px-3 py-2 text-right">Organik</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 16 }).map((__, j) => (
                      <td key={j} className="px-3 py-4"><div className="h-3.5 animate-pulse rounded bg-muted/70" /></td>
                    ))}
                  </tr>
                ))
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-4 py-16">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted"><FileX2 className="h-7 w-7 text-muted-foreground" /></span>
                      <p className="text-sm font-semibold text-foreground">Tidak ada data ditemukan</p>
                      <p className="max-w-xs text-xs text-muted-foreground">Coba ubah kata kunci pencarian atau filter yang dipilih.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((r, i) => {
                  const totalSisa = r.sisaUrea + r.sisaNpk + r.sisaNpkFormula + r.sisaOrganik;
                  const isOver = totalSisa < 0;
                  const isEmpty = totalSisa === 0;
                  // per-cell sisa color
                  const sisaCls = (v: number) =>
                    v < 0
                      ? "text-rose-700 bg-rose-50"
                      : v === 0
                        ? "text-amber-700 bg-amber-50/50"
                        : "text-teal-700 bg-teal-50/40";
                  return (
                    <tr key={i} className={`transition-colors hover:bg-accent/40 ${isOver ? "bg-rose-50/30" : isEmpty ? "bg-amber-50/20" : ""}`}>
                      <td className="border-r border-border px-3 py-3 text-sm text-muted-foreground">{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="border-r border-border px-3 py-3">
                        <span className="font-semibold text-foreground">{r.nama}</span>
                        {r.transaksiCount > 0 && (
                          <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">{r.transaksiCount}x tebus</span>
                        )}
                      </td>
                      <td className="border-r border-border whitespace-nowrap px-3 py-3"><span className="font-mono text-xs text-muted-foreground">{r.nik}</span></td>
                      <td className="border-r border-border px-3 py-3">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{r.poktan}</span>
                      </td>
                      {/* Kuota */}
                      <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-foreground">{numF(r.kuotaUrea)}</td>
                      <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-foreground">{numF(r.kuotaNpk)}</td>
                      <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-foreground">{numF(r.kuotaNpkFormula)}</td>
                      <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-foreground">{numF(r.kuotaOrganik)}</td>
                      {/* Tebus */}
                      <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-amber-700">{numF(r.tebusUrea)}</td>
                      <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-amber-700">{numF(r.tebusNpk)}</td>
                      <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-amber-700">{numF(r.tebusNpkFormula)}</td>
                      <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-amber-700">{numF(r.tebusOrganik)}</td>
                      {/* Sisa */}
                      <td className={`whitespace-nowrap px-3 py-3 text-right text-xs font-extrabold ${sisaCls(r.sisaUrea)}`}>{num(r.sisaUrea)}</td>
                      <td className={`whitespace-nowrap px-3 py-3 text-right text-xs font-extrabold ${sisaCls(r.sisaNpk)}`}>{num(r.sisaNpk)}</td>
                      <td className={`whitespace-nowrap px-3 py-3 text-right text-xs font-extrabold ${sisaCls(r.sisaNpkFormula)}`}>{num(r.sisaNpkFormula)}</td>
                      <td className={`whitespace-nowrap px-3 py-3 text-right text-xs font-extrabold ${sisaCls(r.sisaOrganik)}`}>{num(r.sisaOrganik)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/50">
                  <td colSpan={4} className="border-r border-border px-3 py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-700" />
                      <span className="text-sm font-extrabold uppercase tracking-wide text-foreground">Total</span>
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">{filtered.length} petani</span>
                      {poktan !== "all" && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Poktan: {poktan}</span>}
                    </div>
                  </td>
                  {/* Total Kuota */}
                  <td className="border-r border-border whitespace-nowrap px-3 py-3.5 text-right text-xs font-bold text-foreground">{numF(totals.kuota.urea)}</td>
                  <td className="border-r border-border whitespace-nowrap px-3 py-3.5 text-right text-xs font-bold text-foreground">{numF(totals.kuota.npk)}</td>
                  <td className="border-r border-border whitespace-nowrap px-3 py-3.5 text-right text-xs font-bold text-foreground">{numF(totals.kuota.nf)}</td>
                  <td className="border-r border-border whitespace-nowrap px-3 py-3.5 text-right text-xs font-bold text-foreground">{numF(totals.kuota.o)}</td>
                  {/* Total Tebus */}
                  <td className="border-r border-border whitespace-nowrap px-3 py-3.5 text-right text-xs font-extrabold text-amber-700">{numF(totals.tebus.urea)}</td>
                  <td className="border-r border-border whitespace-nowrap px-3 py-3.5 text-right text-xs font-extrabold text-amber-700">{numF(totals.tebus.npk)}</td>
                  <td className="border-r border-border whitespace-nowrap px-3 py-3.5 text-right text-xs font-extrabold text-amber-700">{numF(totals.tebus.nf)}</td>
                  <td className="border-r border-border whitespace-nowrap px-3 py-3.5 text-right text-xs font-extrabold text-amber-700">{numF(totals.tebus.o)}</td>
                  {/* Total Sisa */}
                  <td className="whitespace-nowrap bg-teal-50/60 px-3 py-3.5 text-right text-xs font-extrabold text-teal-700">{numF(totals.sisa.urea)}</td>
                  <td className="whitespace-nowrap bg-teal-50/60 px-3 py-3.5 text-right text-xs font-extrabold text-teal-700">{numF(totals.sisa.npk)}</td>
                  <td className="whitespace-nowrap bg-teal-50/60 px-3 py-3.5 text-right text-xs font-extrabold text-teal-700">{numF(totals.sisa.nf)}</td>
                  <td className="whitespace-nowrap bg-teal-50/60 px-3 py-3.5 text-right text-xs font-extrabold text-teal-700">{numF(totals.sisa.o)}</td>
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
            dari <span className="font-semibold text-foreground">{filtered.length}</span> petani
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
