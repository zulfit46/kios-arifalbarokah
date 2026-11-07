"use client";

import { Fragment, useMemo, useState } from "react";
import { Search, Wheat, ChevronLeft, ChevronRight, FileX2, Layers, Package } from "lucide-react";
import { usePetani } from "@/hooks/use-petani";
import { formatHa, formatNumber } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Petani } from "@/lib/types";

const PAGE_SIZE = 10;

function num(v: number) {
  return v > 0 ? formatNumber(Math.round(v)) : "-";
}

function MusimCell({ p, mt }: { p: Petani; mt: 1 | 2 }) {
  const kom = mt === 1 ? p.komoditasMT1 : mt === 2 ? p.komoditasMT2 : p.komoditasMT3;
  const ll = mt === 1 ? p.luasLahanMT1 : mt === 2 ? p.luasLahanMT2 : p.luasLahanMT3;
  const u = mt === 1 ? p.pupukUreaMT1 : p.pupukUreaMT2;
  const n = mt === 1 ? p.pupukNpkMT1 : p.pupukNpkMT2;
  const nf = mt === 1 ? p.pupukNpkFormulaMT1 : p.pupukNpkFormulaMT2;
  const o = mt === 1 ? p.pupukOrganikMT1 : p.pupukOrganikMT2;
  const z = mt === 1 ? p.pupukZaMT1 : p.pupukZaMT2;
  const hasData = kom || ll || u || n || nf || o || z;
  if (!hasData) {
    return (
      <td className="px-3 py-3 text-center text-xs text-muted-foreground/50" colSpan={7}>
        —
      </td>
    );
  }
  return (
    <>
      <td className="px-3 py-3">
        {kom ? (
          <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            {kom}
          </span>
        ) : (
          <span className="text-muted-foreground/40">-</span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-xs text-foreground">{ll > 0 ? formatHa(ll) : "-"}</td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-sky-700">{num(u)}</td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-violet-700">{num(n)}</td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-amber-700">{num(nf)}</td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-lime-700">{num(o)}</td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-rose-700">{num(z)}</td>
    </>
  );
}

/** Renders 6 total cells (MT1 + MT2) for one petani. */
function TotalCell({ p }: { p: Petani }) {
  const ll = p.luasLahanMT1 + p.luasLahanMT2;
  const u = p.pupukUreaMT1 + p.pupukUreaMT2;
  const n = p.pupukNpkMT1 + p.pupukNpkMT2;
  const nf = p.pupukNpkFormulaMT1 + p.pupukNpkFormulaMT2;
  const o = p.pupukOrganikMT1 + p.pupukOrganikMT2;
  const z = p.pupukZaMT1 + p.pupukZaMT2;
  const hasData = ll || u || n || nf || o || z;
  if (!hasData) {
    return (
      <td className="px-3 py-3 text-center text-xs text-muted-foreground/50" colSpan={6}>
        —
      </td>
    );
  }
  return (
    <>
      <td className="whitespace-nowrap bg-emerald-50/40 px-3 py-3 text-right text-xs font-bold text-foreground">{ll > 0 ? formatHa(ll) : "-"}</td>
      <td className="whitespace-nowrap bg-emerald-50/40 px-3 py-3 text-right text-xs font-extrabold text-sky-700">{num(u)}</td>
      <td className="whitespace-nowrap bg-emerald-50/40 px-3 py-3 text-right text-xs font-extrabold text-violet-700">{num(n)}</td>
      <td className="whitespace-nowrap bg-emerald-50/40 px-3 py-3 text-right text-xs font-extrabold text-amber-700">{num(nf)}</td>
      <td className="whitespace-nowrap bg-emerald-50/40 px-3 py-3 text-right text-xs font-extrabold text-lime-700">{num(o)}</td>
      <td className="whitespace-nowrap bg-emerald-50/40 px-3 py-3 text-right text-xs font-extrabold text-rose-700">{num(z)}</td>
    </>
  );
}

export function KuotaPetaniView() {
  const { data, isLoading } = usePetani();
  const [q, setQ] = useState("");
  const [subsektor, setSubsektor] = useState("all");
  const [poktan, setPoktan] = useState("all");
  const [page, setPage] = useState(1);

  const subsektorList = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((d) => d.subsektor).filter(Boolean))].sort();
  }, [data]);

  // Poktan list adapts to selected subsektor so it stays relevant
  const poktanList = useMemo(() => {
    if (!data) return [];
    const source = subsektor === "all" ? data : data.filter((d) => d.subsektor === subsektor);
    return [...new Set(source.map((d) => d.namaPoktan).filter(Boolean))].sort();
  }, [data, subsektor]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    return data.filter((d) => {
      if (subsektor !== "all" && d.subsektor !== subsektor) return false;
      if (poktan !== "all" && d.namaPoktan !== poktan) return false;
      if (!term) return true;
      return (
        d.namaPetani.toLowerCase().includes(term) ||
        d.ktp.toLowerCase().includes(term) ||
        d.namaPoktan.toLowerCase().includes(term) ||
        d.komoditasMT1.toLowerCase().includes(term)
      );
    });
  }, [data, q, subsektor, poktan]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // aggregate totals for summary — per musim and grand total (MT1 + MT2)
  const totals = useMemo(() => {
    const mt = {
      MT1: { luas: 0, urea: 0, npk: 0, nf: 0, o: 0, z: 0 },
      MT2: { luas: 0, urea: 0, npk: 0, nf: 0, o: 0, z: 0 },
    };
    for (const d of filtered) {
      mt.MT1.luas += d.luasLahanMT1; mt.MT1.urea += d.pupukUreaMT1; mt.MT1.npk += d.pupukNpkMT1; mt.MT1.nf += d.pupukNpkFormulaMT1; mt.MT1.o += d.pupukOrganikMT1; mt.MT1.z += d.pupukZaMT1;
      mt.MT2.luas += d.luasLahanMT2; mt.MT2.urea += d.pupukUreaMT2; mt.MT2.npk += d.pupukNpkMT2; mt.MT2.nf += d.pupukNpkFormulaMT2; mt.MT2.o += d.pupukOrganikMT2; mt.MT2.z += d.pupukZaMT2;
    }
    const sum = (k: "luas" | "urea" | "npk" | "nf" | "o" | "z") => mt.MT1[k] + mt.MT2[k];
    const luas = sum("luas"), urea = sum("urea"), npk = sum("npk"), nf = sum("nf"), o = sum("o"), z = sum("z");
    return { mt, luas, urea, npk, nf, o, z, total: urea + npk + nf + o + z };
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Wheat className="h-5 w-5" /></span>
            <div>
              <p className="text-xs text-muted-foreground">Petani Diverifikasi</p>
              <p className="text-xl font-extrabold text-foreground">{filtered.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Layers className="h-5 w-5" /></span>
            <div>
              <p className="text-xs text-muted-foreground">Total Luas Lahan</p>
              <p className="text-xl font-extrabold text-foreground">{formatHa(totals.luas)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Package className="h-5 w-5" /></span>
            <div>
              <p className="text-xs text-muted-foreground">Total Kuota Pupuk</p>
              <p className="text-xl font-extrabold text-foreground">{formatNumber(Math.round(totals.total))} <span className="text-xs font-medium text-muted-foreground">Kg</span></p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Rincian (Kg):</span>
            <span className="text-xs font-semibold text-sky-700">Urea {formatNumber(totals.urea)}</span>
            <span className="text-xs font-semibold text-violet-700">NPK {formatNumber(totals.npk)}</span>
            <span className="text-xs font-semibold text-amber-700">Formula {formatNumber(totals.nf)}</span>
            <span className="text-xs font-semibold text-lime-700">Organik {formatNumber(totals.o)}</span>
            <span className="text-xs font-semibold text-rose-700">ZA {formatNumber(totals.z)}</span>
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
              placeholder="Cari nama petani, KTP, poktan, komoditas..."
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="w-full sm:w-52">
            <Select value={subsektor} onValueChange={(v) => { setSubsektor(v); setPoktan("all"); setPage(1); }}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Semua Subsektor" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">Semua Subsektor</SelectItem>
                {subsektorList.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-52">
            <Select value={poktan} onValueChange={(v) => { setPoktan(v); setPage(1); }}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Semua Poktan" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">Semua Poktan</SelectItem>
                {poktanList.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[1500px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">No</th>
                <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Poktan</th>
                <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Petani</th>
                <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">KTP</th>
                <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subsektor</th>
                <th colSpan={7} className="border-r border-border bg-emerald-600/90 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Musim Tanam 1 (MT1)</th>
                <th colSpan={7} className="border-r border-border bg-teal-600/90 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Musim Tanam 2 (MT2)</th>
                <th colSpan={6} className="bg-emerald-800 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Total (MT1 + MT2)</th>
              </tr>
              <tr className="border-b border-border bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="border-r border-border px-3 py-2">Komoditas</th>
                <th className="border-r border-border px-3 py-2 text-right">Luas (Ha)</th>
                <th className="border-r border-border px-3 py-2 text-right">Urea</th>
                <th className="border-r border-border px-3 py-2 text-right">NPK</th>
                <th className="border-r border-border px-3 py-2 text-right">NPK Form.</th>
                <th className="border-r border-border px-3 py-2 text-right">Organik</th>
                <th className="border-r border-border px-3 py-2 text-right">ZA</th>
                <th className="border-r border-border px-3 py-2">Komoditas</th>
                <th className="border-r border-border px-3 py-2 text-right">Luas (Ha)</th>
                <th className="border-r border-border px-3 py-2 text-right">Urea</th>
                <th className="border-r border-border px-3 py-2 text-right">NPK</th>
                <th className="border-r border-border px-3 py-2 text-right">NPK Form.</th>
                <th className="border-r border-border px-3 py-2 text-right">Organik</th>
                <th className="border-r border-border px-3 py-2 text-right">ZA</th>
                <th className="border-r border-border bg-emerald-100 px-3 py-2 text-right">Luas (Ha)</th>
                <th className="border-r border-border bg-emerald-100 px-3 py-2 text-right">Urea</th>
                <th className="border-r border-border bg-emerald-100 px-3 py-2 text-right">NPK</th>
                <th className="border-r border-border bg-emerald-100 px-3 py-2 text-right">NPK Form.</th>
                <th className="border-r border-border bg-emerald-100 px-3 py-2 text-right">Organik</th>
                <th className="bg-emerald-100 px-3 py-2 text-right">ZA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 25 }).map((__, j) => (
                      <td key={j} className="px-3 py-4"><div className="h-3.5 animate-pulse rounded bg-muted/70" /></td>
                    ))}
                  </tr>
                ))
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={25} className="px-4 py-16">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted"><FileX2 className="h-7 w-7 text-muted-foreground" /></span>
                      <p className="text-sm font-semibold text-foreground">Tidak ada data ditemukan</p>
                      <p className="max-w-xs text-xs text-muted-foreground">Coba ubah kata kunci pencarian atau filter subsektor.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((d, i) => (
                  <tr key={i} className="transition-colors hover:bg-accent/40">
                    <td className="border-r border-border px-3 py-3 text-sm text-muted-foreground">{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="border-r border-border px-3 py-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{d.namaPoktan || "-"}</span>
                    </td>
                    <td className="border-r border-border px-3 py-3">
                      <span className="whitespace-nowrap font-semibold text-foreground">{d.namaPetani}</span>
                    </td>
                    <td className="border-r border-border whitespace-nowrap px-3 py-3"><span className="font-mono text-xs text-muted-foreground">{d.ktp || "-"}</span></td>
                    <td className="border-r border-border px-3 py-3">
                      <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">{d.subsektor || "-"}</span>
                    </td>
                    <MusimCell p={d} mt={1} />
                    <MusimCell p={d} mt={2} />
                    <TotalCell p={d} />
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/50">
                  <td colSpan={5} className="border-r border-border px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-700" />
                      <span className="text-sm font-extrabold uppercase tracking-wide text-foreground">Total</span>
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">{filtered.length} petani</span>
                      {poktan !== "all" && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Poktan: {poktan}</span>
                      )}
                    </div>
                  </td>
                  {(Object.keys(totals.mt) as (keyof typeof totals.mt)[]).map((key) => {
                    const m = totals.mt[key];
                    const numF = (v: number) => (v > 0 ? formatNumber(Math.round(v)) : "-");
                    return (
                      <Fragment key={key}>
                        <td className="border-r border-border px-3 py-3.5 text-center text-[11px] font-semibold uppercase text-muted-foreground">{key}</td>
                        <td className="border-r border-border whitespace-nowrap px-3 py-3.5 text-right text-xs font-bold text-foreground">{m.luas > 0 ? formatHa(m.luas) : "-"}</td>
                        <td className="border-r border-border whitespace-nowrap px-3 py-3.5 text-right text-xs font-extrabold text-sky-700">{numF(m.urea)}</td>
                        <td className="border-r border-border whitespace-nowrap px-3 py-3.5 text-right text-xs font-extrabold text-violet-700">{numF(m.npk)}</td>
                        <td className="border-r border-border whitespace-nowrap px-3 py-3.5 text-right text-xs font-extrabold text-amber-700">{numF(m.nf)}</td>
                        <td className="border-r border-border whitespace-nowrap px-3 py-3.5 text-right text-xs font-extrabold text-lime-700">{numF(m.o)}</td>
                        <td className="border-r border-border whitespace-nowrap px-3 py-3.5 text-right text-xs font-extrabold text-rose-700">{numF(m.z)}</td>
                      </Fragment>
                    );
                  })}
                  {/* Grand total = MT1 + MT2 */}
                  <td className="whitespace-nowrap bg-emerald-100/80 px-3 py-3.5 text-right text-xs font-extrabold text-foreground">{totals.luas > 0 ? formatHa(totals.luas) : "-"}</td>
                  <td className="whitespace-nowrap bg-emerald-100/80 px-3 py-3.5 text-right text-xs font-extrabold text-sky-700">{totals.urea > 0 ? formatNumber(Math.round(totals.urea)) : "-"}</td>
                  <td className="whitespace-nowrap bg-emerald-100/80 px-3 py-3.5 text-right text-xs font-extrabold text-violet-700">{totals.npk > 0 ? formatNumber(Math.round(totals.npk)) : "-"}</td>
                  <td className="whitespace-nowrap bg-emerald-100/80 px-3 py-3.5 text-right text-xs font-extrabold text-amber-700">{totals.nf > 0 ? formatNumber(Math.round(totals.nf)) : "-"}</td>
                  <td className="whitespace-nowrap bg-emerald-100/80 px-3 py-3.5 text-right text-xs font-extrabold text-lime-700">{totals.o > 0 ? formatNumber(Math.round(totals.o)) : "-"}</td>
                  <td className="whitespace-nowrap bg-emerald-100/80 px-3 py-3.5 text-right text-xs font-extrabold text-rose-700">{totals.z > 0 ? formatNumber(Math.round(totals.z)) : "-"}</td>
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
