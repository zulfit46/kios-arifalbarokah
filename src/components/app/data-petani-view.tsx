"use client";

import { useMemo, useState } from "react";
import { Search, Users, MapPin, ChevronLeft, ChevronRight, FileX2, Filter } from "lucide-react";
import { usePetani } from "@/hooks/use-petani";
import { formatDate } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 10;

export function DataPetaniView() {
  const { data, isLoading } = usePetani();
  const [q, setQ] = useState("");
  const [poktan, setPoktan] = useState("all");
  const [page, setPage] = useState(1);

  const poktanList = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((d) => d.namaPoktan).filter(Boolean))].sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    return data.filter((d) => {
      if (poktan !== "all" && d.namaPoktan !== poktan) return false;
      if (!term) return true;
      return (
        d.namaPetani.toLowerCase().includes(term) ||
        d.ktp.toLowerCase().includes(term) ||
        d.namaPoktan.toLowerCase().includes(term) ||
        d.alamat.toLowerCase().includes(term) ||
        d.tempatLahir.toLowerCase().includes(term)
      );
    });
  }, [data, q, poktan]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Total Petani</p>
              <p className="text-xl font-extrabold text-foreground">{data?.length ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <Filter className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Hasil Filter</p>
              <p className="text-xl font-extrabold text-foreground">{filtered.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-50 text-lime-700">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Jumlah Poktan</p>
              <p className="text-xl font-extrabold text-foreground">{poktanList.length}</p>
            </div>
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
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama petani, KTP, alamat..."
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="w-full sm:w-56">
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
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">No</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Poktan</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Petani</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">KTP</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tempat Lahir</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tanggal Lahir</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alamat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 animate-pulse rounded bg-muted/70" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted">
                        <FileX2 className="h-7 w-7 text-muted-foreground" />
                      </span>
                      <p className="text-sm font-semibold text-foreground">Tidak ada data ditemukan</p>
                      <p className="max-w-xs text-xs text-muted-foreground">
                        Coba ubah kata kunci pencarian atau filter poktan yang dipilih.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((d, i) => (
                  <tr key={i} className="transition-colors hover:bg-accent/40">
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">
                      {(safePage - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {d.namaPoktan || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-foreground">{d.namaPetani}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-muted-foreground">{d.ktp || "-"}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-foreground">{d.tempatLahir || "-"}</td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{formatDate(d.tanggalLahir)}</td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{d.alamat || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
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
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
