"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Search,
  FileDown,
  FileX2,
  Wheat,
  Truck,
  Scale,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Building2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePenyaluran, usePetani } from "@/hooks/use-petani";
import { formatHa, formatNumber } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Penyaluran, Petani } from "@/lib/types";

// ===== Tab 1: Alokasi Kuota per Poktan =====

interface PoktanReport {
  namaPoktan: string;
  kodeDesa: string; // "Posi" | "Tiromanda"
  subsektor: string;
  petaniCount: number;
  komoditasMT1: string;
  luasLahanMT1: number;
  pupukUreaMT1: number;
  pupukNpkMT1: number;
  pupukNpkFormulaMT1: number;
  pupukOrganikMT1: number;
  pupukZaMT1: number;
  komoditasMT2: string;
  luasLahanMT2: number;
  pupukUreaMT2: number;
  pupukNpkMT2: number;
  pupukNpkFormulaMT2: number;
  pupukOrganikMT2: number;
  pupukZaMT2: number;
  komoditasMT3: string;
  luasLahanMT3: number;
  pupukUreaMT3: number;
  pupukNpkMT3: number;
  pupukNpkFormulaMT3: number;
  pupukOrganikMT3: number;
  pupukZaMT3: number;
}

function emptyReport(namaPoktan: string, kodeDesa: string, subsektor: string): PoktanReport {
  return {
    namaPoktan,
    kodeDesa,
    subsektor,
    petaniCount: 0,
    komoditasMT1: "",
    luasLahanMT1: 0,
    pupukUreaMT1: 0,
    pupukNpkMT1: 0,
    pupukNpkFormulaMT1: 0,
    pupukOrganikMT1: 0,
    pupukZaMT1: 0,
    komoditasMT2: "",
    luasLahanMT2: 0,
    pupukUreaMT2: 0,
    pupukNpkMT2: 0,
    pupukNpkFormulaMT2: 0,
    pupukOrganikMT2: 0,
    pupukZaMT2: 0,
    komoditasMT3: "",
    luasLahanMT3: 0,
    pupukUreaMT3: 0,
    pupukNpkMT3: 0,
    pupukNpkFormulaMT3: 0,
    pupukOrganikMT3: 0,
    pupukZaMT3: 0,
  };
}

function aggregateByPoktan(data: Petani[]): PoktanReport[] {
  const map = new Map<string, PoktanReport>();
  for (const p of data) {
    const key = p.namaPoktan || "(Tanpa Poktan)";
    let r = map.get(key);
    if (!r) {
      r = emptyReport(key, p.kodeDesa || "-", p.subsektor || "-");
      map.set(key, r);
    }
    if (p.kodeDesa && (r.kodeDesa === "-" || !r.kodeDesa)) {
      r.kodeDesa = p.kodeDesa;
    }
    r.petaniCount += 1;
    if (p.subsektor && (r.subsektor === "-" || r.subsektor === "")) r.subsektor = p.subsektor;
    if (p.komoditasMT1 && !r.komoditasMT1) r.komoditasMT1 = p.komoditasMT1;
    if (p.komoditasMT2 && !r.komoditasMT2) r.komoditasMT2 = p.komoditasMT2;
    if (p.komoditasMT3 && !r.komoditasMT3) r.komoditasMT3 = p.komoditasMT3;
    r.luasLahanMT1 += p.luasLahanMT1;
    r.pupukUreaMT1 += p.pupukUreaMT1;
    r.pupukNpkMT1 += p.pupukNpkMT1;
    r.pupukNpkFormulaMT1 += p.pupukNpkFormulaMT1;
    r.pupukOrganikMT1 += p.pupukOrganikMT1;
    r.pupukZaMT1 += p.pupukZaMT1;
    r.luasLahanMT2 += p.luasLahanMT2;
    r.pupukUreaMT2 += p.pupukUreaMT2;
    r.pupukNpkMT2 += p.pupukNpkMT2;
    r.pupukNpkFormulaMT2 += p.pupukNpkFormulaMT2;
    r.pupukOrganikMT2 += p.pupukOrganikMT2;
    r.pupukZaMT2 += p.pupukZaMT2;
    r.luasLahanMT3 += p.luasLahanMT3;
    r.pupukUreaMT3 += p.pupukUreaMT3;
    r.pupukNpkMT3 += p.pupukNpkMT3;
    r.pupukNpkFormulaMT3 += p.pupukNpkFormulaMT3;
    r.pupukOrganikMT3 += p.pupukOrganikMT3;
    r.pupukZaMT3 += p.pupukZaMT3;
  }
  return [...map.values()].sort((a, b) => {
    // Sort by desa first, then poktan name
    if (a.kodeDesa !== b.kodeDesa) return a.kodeDesa.localeCompare(b.kodeDesa);
    return a.namaPoktan.localeCompare(b.namaPoktan);
  });
}

function num(v: number) {
  return v > 0 ? formatNumber(Math.round(v)) : "-";
}

function fmtDec(v: number) {
  return v > 0 ? formatNumber(v, 2) : "-";
}

/** Render a single Alokasi Kuota section into a jsPDF document */
function renderAlokasiSection(
  doc: jsPDF,
  rows: PoktanReport[],
  desaTitle: string,
  meta: { subsektor: string; poktan: string }
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header banner
  doc.setFillColor(16, 99, 66);
  doc.rect(0, 0, pageWidth, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`KIOS PENGECER ARIF AL BAROKA — ${desaTitle.toUpperCase()}`, 14, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    `Laporan Rekapitulasi Alokasi Kuota Pupuk Bersubsidi — ${desaTitle} (${rows.length} Kelompok Tani)`,
    14,
    18
  );

  // Meta info
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(8.5);
  let y = 31;
  doc.setFont("helvetica", "bold");
  doc.text("Desa / Lokasi:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${desaTitle} | Kab. Luwu, Sulawesi Selatan`, 40, y);

  doc.setFont("helvetica", "bold");
  doc.text("Periode:", 170, y);
  doc.setFont("helvetica", "normal");
  doc.text("Musim Tanam MT1 & MT2 (Tahun Berjalan)", 188, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Kios Pengecer:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text("ARIF AL BAROKA", 40, y);

  doc.setFont("helvetica", "bold");
  doc.text("Tanggal Cetak:", 170, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    195,
    y
  );
  y += 3;

  // Build table
  const head = [
    [
      { content: "No", rowSpan: 2, styles: { halign: "center", valign: "middle", fillColor: [16, 99, 66], textColor: 255, fontStyle: "bold", fontSize: 7.5 } },
      { content: "Nama Poktan", rowSpan: 2, styles: { halign: "left", valign: "middle", fillColor: [16, 99, 66], textColor: 255, fontStyle: "bold", fontSize: 7.5 } },
      { content: "Desa", rowSpan: 2, styles: { halign: "center", valign: "middle", fillColor: [16, 99, 66], textColor: 255, fontStyle: "bold", fontSize: 7.5 } },
      { content: "Subsektor", rowSpan: 2, styles: { halign: "left", valign: "middle", fillColor: [16, 99, 66], textColor: 255, fontStyle: "bold", fontSize: 7.5 } },
      { content: "Musim Tanam 1 (MT1)", colSpan: 7, styles: { halign: "center", fillColor: [13, 148, 102], textColor: 255, fontStyle: "bold", fontSize: 7.5 } },
      { content: "Musim Tanam 2 (MT2)", colSpan: 7, styles: { halign: "center", fillColor: [15, 118, 110], textColor: 255, fontStyle: "bold", fontSize: 7.5 } },
      { content: "Total (MT1 + MT2)", colSpan: 6, styles: { halign: "center", fillColor: [5, 90, 60], textColor: 255, fontStyle: "bold", fontSize: 7.5 } },
    ],
    [
      "Komoditas", "Luas (Ha)", "Urea", "NPK", "NPK Form.", "Organik", "ZA",
      "Komoditas", "Luas (Ha)", "Urea", "NPK", "NPK Form.", "Organik", "ZA",
      "Luas (Ha)", "Urea", "NPK", "NPK Form.", "Organik", "ZA",
    ].map((t, idx) => ({
      content: t,
      styles: {
        halign: "center",
        fillColor: idx >= 14 ? [220, 240, 230] : [16, 99, 66],
        textColor: idx >= 14 ? [40, 40, 40] : 255,
        fontStyle: "bold",
        fontSize: 7,
      },
    })),
  ];

  let totalPetaniDesa = 0;
  const body: any[] = rows.map((r, i) => {
    totalPetaniDesa += r.petaniCount;
    return [
      { content: String(i + 1), styles: { halign: "center", fontSize: 7 } },
      { content: `${r.namaPoktan} (${r.petaniCount} petani)`, styles: { halign: "left", fontStyle: "bold", fontSize: 7 } },
      { content: r.kodeDesa, styles: { halign: "center", fontSize: 7 } },
      { content: r.subsektor, styles: { halign: "left", fontSize: 7 } },
      { content: r.komoditasMT1 || "-", styles: { halign: "left", fontSize: 7 } },
      { content: fmtDec(r.luasLahanMT1), styles: { halign: "right", fontSize: 7 } },
      { content: num(r.pupukUreaMT1), styles: { halign: "right", fontSize: 7, textColor: [2, 132, 199] } },
      { content: num(r.pupukNpkMT1), styles: { halign: "right", fontSize: 7, textColor: [124, 58, 237] } },
      { content: num(r.pupukNpkFormulaMT1), styles: { halign: "right", fontSize: 7, textColor: [217, 119, 6] } },
      { content: num(r.pupukOrganikMT1), styles: { halign: "right", fontSize: 7, textColor: [101, 163, 13] } },
      { content: num(r.pupukZaMT1), styles: { halign: "right", fontSize: 7, textColor: [225, 29, 72] } },
      { content: r.komoditasMT2 || "-", styles: { halign: "left", fontSize: 7 } },
      { content: fmtDec(r.luasLahanMT2), styles: { halign: "right", fontSize: 7 } },
      { content: num(r.pupukUreaMT2), styles: { halign: "right", fontSize: 7, textColor: [2, 132, 199] } },
      { content: num(r.pupukNpkMT2), styles: { halign: "right", fontSize: 7, textColor: [124, 58, 237] } },
      { content: num(r.pupukNpkFormulaMT2), styles: { halign: "right", fontSize: 7, textColor: [217, 119, 6] } },
      { content: num(r.pupukOrganikMT2), styles: { halign: "right", fontSize: 7, textColor: [101, 163, 13] } },
      { content: num(r.pupukZaMT2), styles: { halign: "right", fontSize: 7, textColor: [225, 29, 72] } },
      { content: fmtDec(r.luasLahanMT1 + r.luasLahanMT2), styles: { halign: "right", fontSize: 7, fillColor: [237, 247, 242], fontStyle: "bold" } },
      { content: num(r.pupukUreaMT1 + r.pupukUreaMT2), styles: { halign: "right", fontSize: 7, fillColor: [237, 247, 242], fontStyle: "bold", textColor: [2, 132, 199] } },
      { content: num(r.pupukNpkMT1 + r.pupukNpkMT2), styles: { halign: "right", fontSize: 7, fillColor: [237, 247, 242], fontStyle: "bold", textColor: [124, 58, 237] } },
      { content: num(r.pupukNpkFormulaMT1 + r.pupukNpkFormulaMT2), styles: { halign: "right", fontSize: 7, fillColor: [237, 247, 242], fontStyle: "bold", textColor: [217, 119, 6] } },
      { content: num(r.pupukOrganikMT1 + r.pupukOrganikMT2), styles: { halign: "right", fontSize: 7, fillColor: [237, 247, 242], fontStyle: "bold", textColor: [101, 163, 13] } },
      { content: num(r.pupukZaMT1 + r.pupukZaMT2), styles: { halign: "right", fontSize: 7, fillColor: [237, 247, 242], fontStyle: "bold", textColor: [225, 29, 72] } },
    ];
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.luas1 += r.luasLahanMT1; acc.u1 += r.pupukUreaMT1; acc.n1 += r.pupukNpkMT1; acc.nf1 += r.pupukNpkFormulaMT1; acc.o1 += r.pupukOrganikMT1; acc.z1 += r.pupukZaMT1;
      acc.luas2 += r.luasLahanMT2; acc.u2 += r.pupukUreaMT2; acc.n2 += r.pupukNpkMT2; acc.nf2 += r.pupukNpkFormulaMT2; acc.o2 += r.pupukOrganikMT2; acc.z2 += r.pupukZaMT2;
      return acc;
    },
    { luas1: 0, u1: 0, n1: 0, nf1: 0, o1: 0, z1: 0, luas2: 0, u2: 0, n2: 0, nf2: 0, o2: 0, z2: 0 }
  );

  const totalCell = { styles: { halign: "right", fontSize: 7, fillColor: [237, 247, 242], fontStyle: "bold" } };
  body.push([
    { content: `TOTAL ${desaTitle.toUpperCase()} (${rows.length} Poktan, ${totalPetaniDesa} Petani)`, colSpan: 4, styles: { halign: "left", fontSize: 7, fillColor: [237, 247, 242], fontStyle: "bold" } },
    { content: "-", styles: { halign: "center", fontSize: 7, fillColor: [237, 247, 242], fontStyle: "bold" } },
    { content: fmtDec(totals.luas1), ...totalCell },
    { content: num(totals.u1), ...totalCell },
    { content: num(totals.n1), ...totalCell },
    { content: num(totals.nf1), ...totalCell },
    { content: num(totals.o1), ...totalCell },
    { content: num(totals.z1), ...totalCell },
    { content: "-", styles: { halign: "center", fontSize: 7, fillColor: [237, 247, 242], fontStyle: "bold" } },
    { content: fmtDec(totals.luas2), ...totalCell },
    { content: num(totals.u2), ...totalCell },
    { content: num(totals.n2), ...totalCell },
    { content: num(totals.nf2), ...totalCell },
    { content: num(totals.o2), ...totalCell },
    { content: num(totals.z2), ...totalCell },
    { content: fmtDec(totals.luas1 + totals.luas2), ...totalCell },
    { content: num(totals.u1 + totals.u2), ...totalCell },
    { content: num(totals.n1 + totals.n2), ...totalCell },
    { content: num(totals.nf1 + totals.nf2), ...totalCell },
    { content: num(totals.o1 + totals.o2), ...totalCell },
    { content: num(totals.z1 + totals.z2), ...totalCell },
  ]);

  autoTable(doc, {
    head: head as any,
    body: body as any,
    startY: y + 2,
    margin: { left: 8, right: 8 },
    styles: { font: "helvetica", cellPadding: 1.4, lineColor: [220, 220, 220], lineWidth: 0.1, overflow: "linebreak" },
    alternateRowStyles: { fillColor: [248, 251, 249] },
    didDrawPage: () => {
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Dokumen Resmi Kios Pengecer ARIF AL BAROKA — Wilayah Kerja: ${desaTitle}`,
        14,
        pageHeight - 6
      );
      const pageNum = doc.getNumberOfPages();
      doc.text(`Halaman ${pageNum}`, pageWidth - 24, pageHeight - 6);
    },
  });
}

/** Export Alokasi PDF supporting single Desa or 2 Desa */
function exportAlokasiPDF(
  allRows: PoktanReport[],
  targetDesa: "Posi" | "Tiromanda" | "both",
  meta: { subsektor: string; poktan: string }
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
  const dateStr = new Date().toISOString().slice(0, 10);

  if (targetDesa === "Posi") {
    const rows = allRows.filter((r) => r.kodeDesa.toLowerCase().includes("posi"));
    renderAlokasiSection(doc, rows, "Desa Posi", meta);
    doc.save(`Laporan_Alokasi_Pupuk_Desa_Posi_ARIF_AL_BAROKA_${dateStr}.pdf`);
  } else if (targetDesa === "Tiromanda") {
    const rows = allRows.filter((r) => r.kodeDesa.toLowerCase().includes("tiromanda"));
    renderAlokasiSection(doc, rows, "Desa Tiromanda", meta);
    doc.save(`Laporan_Alokasi_Pupuk_Desa_Tiromanda_ARIF_AL_BAROKA_${dateStr}.pdf`);
  } else {
    // Both 2 Desa in one multi-page report: Page 1 Posi, Page 2 Tiromanda
    const rowsPosi = allRows.filter((r) => r.kodeDesa.toLowerCase().includes("posi"));
    const rowsTiro = allRows.filter((r) => r.kodeDesa.toLowerCase().includes("tiromanda"));

    renderAlokasiSection(doc, rowsPosi, "Desa Posi", meta);
    doc.addPage();
    renderAlokasiSection(doc, rowsTiro, "Desa Tiromanda", meta);
    doc.save(`Laporan_Alokasi_Pupuk_2_Desa_Posi_dan_Tiromanda_${dateStr}.pdf`);
  }
}

// ===== Tab 2: Realisasi & Sisa Kuota per Poktan =====

interface RealisasiReport {
  namaPoktan: string;
  kodeDesa: string; // "Posi" | "Tiromanda"
  subsektor: string;
  petaniCount: number;
  kuotaUrea: number;
  kuotaNpk: number;
  kuotaNpkFormula: number;
  kuotaOrganik: number;
  tebusUrea: number;
  tebusNpk: number;
  tebusNpkFormula: number;
  tebusOrganik: number;
  transaksiCount: number;
  sisaUrea: number;
  sisaNpk: number;
  sisaNpkFormula: number;
  sisaOrganik: number;
}

function aggregateRealisasiByPoktan(petani: Petani[], penyaluran: Penyaluran[]): RealisasiReport[] {
  // Aggregate kuota per poktan (MT1 + MT2)
  const kuotaMap = new Map<
    string,
    { kodeDesa: string; subsektor: string; petaniCount: number; urea: number; npk: number; nf: number; o: number }
  >();
  for (const p of petani) {
    const key = p.namaPoktan || "(Tanpa Poktan)";
    let e = kuotaMap.get(key);
    if (!e) {
      e = {
        kodeDesa: p.kodeDesa || "-",
        subsektor: p.subsektor || "-",
        petaniCount: 0,
        urea: 0,
        npk: 0,
        nf: 0,
        o: 0,
      };
      kuotaMap.set(key, e);
    }
    if (p.kodeDesa && (e.kodeDesa === "-" || !e.kodeDesa)) e.kodeDesa = p.kodeDesa;
    e.petaniCount += 1;
    if (p.subsektor && e.subsektor === "-") e.subsektor = p.subsektor;
    e.urea += p.pupukUreaMT1 + p.pupukUreaMT2;
    e.npk += p.pupukNpkMT1 + p.pupukNpkMT2;
    e.nf += p.pupukNpkFormulaMT1 + p.pupukNpkFormulaMT2;
    e.o += p.pupukOrganikMT1 + p.pupukOrganikMT2;
  }

  // Map NIK -> poktan (untuk join dengan penyaluran)
  const nikToPoktan = new Map<string, Map<string, { urea: number; npk: number; nf: number; o: number }>>();
  for (const p of petani) {
    const nik = p.ktp.replace(/`/g, "").trim();
    if (!nik) continue;
    const poktan = p.namaPoktan || "(Tanpa Poktan)";
    if (!nikToPoktan.has(nik)) nikToPoktan.set(nik, new Map());
    const pm = nikToPoktan.get(nik)!;
    let e = pm.get(poktan);
    if (!e) {
      e = { urea: 0, npk: 0, nf: 0, o: 0 };
      pm.set(poktan, e);
    }
    e.urea += p.pupukUreaMT1 + p.pupukUreaMT2;
    e.npk += p.pupukNpkMT1 + p.pupukNpkMT2;
    e.nf += p.pupukNpkFormulaMT1 + p.pupukNpkFormulaMT2;
    e.o += p.pupukOrganikMT1 + p.pupukOrganikMT2;
  }

  // Aggregate tebus per poktan
  const tebusMap = new Map<string, { urea: number; npk: number; nf: number; o: number; count: number }>();
  const tebusByNik = new Map<string, { urea: number; npk: number; nf: number; o: number; count: number }>();
  for (const s of penyaluran) {
    const nik = s.nik.replace(/`/g, "").trim();
    if (!nik) continue;
    let e = tebusByNik.get(nik);
    if (!e) {
      e = { urea: 0, npk: 0, nf: 0, o: 0, count: 0 };
      tebusByNik.set(nik, e);
    }
    e.urea += s.urea;
    e.npk += s.npk;
    e.nf += s.npkFormulaKhusus;
    e.o += s.organik;
    e.count += 1;
  }

  for (const [nik, t] of tebusByNik) {
    const poktanMap = nikToPoktan.get(nik);
    if (!poktanMap) continue;
    const tot = { urea: 0, npk: 0, nf: 0, o: 0 };
    for (const v of poktanMap.values()) {
      tot.urea += v.urea;
      tot.npk += v.npk;
      tot.nf += v.nf;
      tot.o += v.o;
    }
    for (const [poktan, k] of poktanMap) {
      let e = tebusMap.get(poktan);
      if (!e) {
        e = { urea: 0, npk: 0, nf: 0, o: 0, count: 0 };
        tebusMap.set(poktan, e);
      }
      e.urea += tot.urea > 0 ? t.urea * (k.urea / tot.urea) : 0;
      e.npk += tot.npk > 0 ? t.npk * (k.npk / tot.npk) : 0;
      e.nf += tot.nf > 0 ? t.nf * (k.nf / tot.nf) : 0;
      e.o += tot.o > 0 ? t.o * (k.o / tot.o) : 0;
      e.count += t.count;
    }
  }

  const rows: RealisasiReport[] = [];
  for (const [namaPoktan, k] of kuotaMap) {
    const t = tebusMap.get(namaPoktan);
    rows.push({
      namaPoktan,
      kodeDesa: k.kodeDesa,
      subsektor: k.subsektor,
      petaniCount: k.petaniCount,
      kuotaUrea: k.urea,
      kuotaNpk: k.npk,
      kuotaNpkFormula: k.nf,
      kuotaOrganik: k.o,
      tebusUrea: t?.urea ?? 0,
      tebusNpk: t?.npk ?? 0,
      tebusNpkFormula: t?.nf ?? 0,
      tebusOrganik: t?.o ?? 0,
      transaksiCount: t?.count ?? 0,
      sisaUrea: k.urea - (t?.urea ?? 0),
      sisaNpk: k.npk - (t?.npk ?? 0),
      sisaNpkFormula: k.nf - (t?.nf ?? 0),
      sisaOrganik: k.o - (t?.o ?? 0),
    });
  }
  rows.sort((a, b) => {
    if (a.kodeDesa !== b.kodeDesa) return a.kodeDesa.localeCompare(b.kodeDesa);
    return a.namaPoktan.localeCompare(b.namaPoktan);
  });
  return rows;
}

/** Render a single Realisasi section into a jsPDF document */
function renderRealisasiSection(
  doc: jsPDF,
  rows: RealisasiReport[],
  desaTitle: string,
  meta: { subsektor: string; poktan: string }
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header band
  doc.setFillColor(16, 99, 66);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  doc.text(`KIOS PENGECER ARIF AL BAROKA — ${desaTitle.toUpperCase()}`, 14, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Laporan Realisasi Penyaluran & Sisa Kuota Pupuk — ${desaTitle} (${rows.length} Kelompok Tani)`,
    14,
    17
  );

  // Meta info
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(8.5);
  let y = 29;
  doc.setFont("helvetica", "bold");
  doc.text("Desa / Lokasi:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${desaTitle} | Kab. Luwu, Sulawesi Selatan`, 38, y);

  doc.setFont("helvetica", "bold");
  doc.text("Periode:", 170, y);
  doc.setFont("helvetica", "normal");
  doc.text("Musim Tanam MT1 & MT2", 188, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Kios Pengecer:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text("ARIF AL BAROKA", 38, y);

  doc.setFont("helvetica", "bold");
  doc.text("Tanggal Cetak:", 170, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    195,
    y
  );
  y += 3;

  const head = [
    [
      { content: "No", rowSpan: 2, styles: { halign: "center", valign: "middle", fillColor: [16, 99, 66], textColor: 255, fontStyle: "bold", fontSize: 7.5 } },
      { content: "Nama Poktan", rowSpan: 2, styles: { halign: "left", valign: "middle", fillColor: [16, 99, 66], textColor: 255, fontStyle: "bold", fontSize: 7.5 } },
      { content: "Desa", rowSpan: 2, styles: { halign: "center", valign: "middle", fillColor: [16, 99, 66], textColor: 255, fontStyle: "bold", fontSize: 7.5 } },
      { content: "Subsektor", rowSpan: 2, styles: { halign: "left", valign: "middle", fillColor: [16, 99, 66], textColor: 255, fontStyle: "bold", fontSize: 7.5 } },
      { content: "Kuota (MT1 + MT2)", colSpan: 4, styles: { halign: "center", fillColor: [13, 148, 102], textColor: 255, fontStyle: "bold", fontSize: 7.5 } },
      { content: "Realisasi Tebus", colSpan: 4, styles: { halign: "center", fillColor: [217, 119, 6], textColor: 255, fontStyle: "bold", fontSize: 7.5 } },
      { content: "Sisa Kuota", colSpan: 4, styles: { halign: "center", fillColor: [15, 118, 110], textColor: 255, fontStyle: "bold", fontSize: 7.5 } },
    ],
    ["Urea", "NPK", "NPK Form.", "Organik", "Urea", "NPK", "NPK Form.", "Organik", "Urea", "NPK", "NPK Form.", "Organik"].map((t) => ({
      content: t,
      styles: { halign: "center", fillColor: [16, 99, 66], textColor: 255, fontStyle: "bold", fontSize: 7 },
    })),
  ];

  let totalPetaniDesa = 0;
  const body: any[] = rows.map((r, i) => {
    totalPetaniDesa += r.petaniCount;
    const numF = (v: number) => (v !== 0 ? formatNumber(Math.round(v)) : "-");
    return [
      { content: String(i + 1), styles: { halign: "center", fontSize: 7 } },
      { content: `${r.namaPoktan} (${r.petaniCount} petani)`, styles: { halign: "left", fontStyle: "bold", fontSize: 7 } },
      { content: r.kodeDesa, styles: { halign: "center", fontSize: 7 } },
      { content: r.subsektor, styles: { halign: "left", fontSize: 7 } },
      { content: numF(r.kuotaUrea), styles: { halign: "right", fontSize: 7, textColor: [2, 132, 199] } },
      { content: numF(r.kuotaNpk), styles: { halign: "right", fontSize: 7, textColor: [124, 58, 237] } },
      { content: numF(r.kuotaNpkFormula), styles: { halign: "right", fontSize: 7, textColor: [217, 119, 6] } },
      { content: numF(r.kuotaOrganik), styles: { halign: "right", fontSize: 7, textColor: [101, 163, 13] } },
      { content: numF(r.tebusUrea), styles: { halign: "right", fontSize: 7, textColor: [2, 132, 199] } },
      { content: numF(r.tebusNpk), styles: { halign: "right", fontSize: 7, textColor: [124, 58, 237] } },
      { content: numF(r.tebusNpkFormula), styles: { halign: "right", fontSize: 7, textColor: [217, 119, 6] } },
      { content: numF(r.tebusOrganik), styles: { halign: "right", fontSize: 7, textColor: [101, 163, 13] } },
      { content: numF(r.sisaUrea), styles: { halign: "right", fontSize: 7, fontStyle: "bold", fillColor: [237, 247, 242], textColor: [2, 132, 199] } },
      { content: numF(r.sisaNpk), styles: { halign: "right", fontSize: 7, fontStyle: "bold", fillColor: [237, 247, 242], textColor: [124, 58, 237] } },
      { content: numF(r.sisaNpkFormula), styles: { halign: "right", fontSize: 7, fontStyle: "bold", fillColor: [237, 247, 242], textColor: [217, 119, 6] } },
      { content: numF(r.sisaOrganik), styles: { halign: "right", fontSize: 7, fontStyle: "bold", fillColor: [237, 247, 242], textColor: [101, 163, 13] } },
    ];
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.kU += r.kuotaUrea; acc.kN += r.kuotaNpk; acc.kNF += r.kuotaNpkFormula; acc.kO += r.kuotaOrganik;
      acc.tU += r.tebusUrea; acc.tN += r.tebusNpk; acc.tNF += r.tebusNpkFormula; acc.tO += r.tebusOrganik;
      return acc;
    },
    { kU: 0, kN: 0, kNF: 0, kO: 0, tU: 0, tN: 0, tNF: 0, tO: 0 }
  );

  const tc = { styles: { halign: "right", fontSize: 7, fillColor: [237, 247, 242], fontStyle: "bold" } };
  body.push([
    { content: `TOTAL ${desaTitle.toUpperCase()} (${rows.length} Poktan, ${totalPetaniDesa} Petani)`, colSpan: 4, styles: { halign: "left", fontSize: 7, fillColor: [237, 247, 242], fontStyle: "bold" } },
    { content: formatNumber(Math.round(totals.kU)), ...tc },
    { content: formatNumber(Math.round(totals.kN)), ...tc },
    { content: formatNumber(Math.round(totals.kNF)), ...tc },
    { content: formatNumber(Math.round(totals.kO)), ...tc },
    { content: formatNumber(Math.round(totals.tU)), ...tc },
    { content: formatNumber(Math.round(totals.tN)), ...tc },
    { content: formatNumber(Math.round(totals.tNF)), ...tc },
    { content: formatNumber(Math.round(totals.tO)), ...tc },
    { content: formatNumber(Math.round(totals.kU - totals.tU)), ...tc },
    { content: formatNumber(Math.round(totals.kN - totals.tN)), ...tc },
    { content: formatNumber(Math.round(totals.kNF - totals.tNF)), ...tc },
    { content: formatNumber(Math.round(totals.kO - totals.tO)), ...tc },
  ]);

  autoTable(doc, {
    head: head as any,
    body: body as any,
    startY: y + 2,
    margin: { left: 8, right: 8 },
    styles: { font: "helvetica", cellPadding: 1.4, lineColor: [220, 220, 220], lineWidth: 0.1, overflow: "linebreak" },
    alternateRowStyles: { fillColor: [248, 251, 249] },
    didDrawPage: () => {
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Dokumen Resmi Kios Pengecer ARIF AL BAROKA — Realisasi Wilayah: ${desaTitle}`,
        14,
        pageHeight - 6
      );
      doc.text(`Halaman ${doc.getNumberOfPages()}`, pageWidth - 24, pageHeight - 6);
    },
  });
}

/** Export Realisasi PDF supporting single Desa or 2 Desa */
function exportRealisasiPDF(
  allRows: RealisasiReport[],
  targetDesa: "Posi" | "Tiromanda" | "both",
  meta: { subsektor: string; poktan: string }
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const dateStr = new Date().toISOString().slice(0, 10);

  if (targetDesa === "Posi") {
    const rows = allRows.filter((r) => r.kodeDesa.toLowerCase().includes("posi"));
    renderRealisasiSection(doc, rows, "Desa Posi", meta);
    doc.save(`Laporan_Realisasi_Pupuk_Desa_Posi_ARIF_AL_BAROKA_${dateStr}.pdf`);
  } else if (targetDesa === "Tiromanda") {
    const rows = allRows.filter((r) => r.kodeDesa.toLowerCase().includes("tiromanda"));
    renderRealisasiSection(doc, rows, "Desa Tiromanda", meta);
    doc.save(`Laporan_Realisasi_Pupuk_Desa_Tiromanda_ARIF_AL_BAROKA_${dateStr}.pdf`);
  } else {
    // Both 2 Desa in one multi-page report: Page 1 Posi, Page 2 Tiromanda
    const rowsPosi = allRows.filter((r) => r.kodeDesa.toLowerCase().includes("posi"));
    const rowsTiro = allRows.filter((r) => r.kodeDesa.toLowerCase().includes("tiromanda"));

    renderRealisasiSection(doc, rowsPosi, "Desa Posi", meta);
    doc.addPage();
    renderRealisasiSection(doc, rowsTiro, "Desa Tiromanda", meta);
    doc.save(`Laporan_Realisasi_Pupuk_2_Desa_Posi_dan_Tiromanda_${dateStr}.pdf`);
  }
}

export function LaporanView() {
  const { data, isLoading } = usePetani();
  const { data: penyaluran } = usePenyaluran();
  const [q, setQ] = useState("");
  const [desa, setDesa] = useState("all"); // "all" | "Posi" | "Tiromanda"
  const [subsektor, setSubsektor] = useState("all");
  const [poktan, setPoktan] = useState("all");
  const [activeTab, setActiveTab] = useState("kuota");

  // Desa list from data
  const desaList = useMemo(() => {
    if (!data) return ["Posi", "Tiromanda"];
    return [...new Set(data.map((d) => d.kodeDesa).filter(Boolean))].sort();
  }, [data]);

  const subsektorList = useMemo(() => {
    if (!data) return [];
    const source = desa === "all" ? data : data.filter((d) => d.kodeDesa === desa);
    return [...new Set(source.map((d) => d.subsektor).filter(Boolean))].sort();
  }, [data, desa]);

  const poktanList = useMemo(() => {
    if (!data) return [];
    let source = data;
    if (desa !== "all") source = source.filter((d) => d.kodeDesa === desa);
    if (subsektor !== "all") source = source.filter((d) => d.subsektor === subsektor);
    return [...new Set(source.map((d) => d.namaPoktan).filter(Boolean))].sort();
  }, [data, desa, subsektor]);

  // Aggregate per poktan from full data
  const allReports = useMemo(() => (data ? aggregateByPoktan(data) : []), [data]);

  // Apply filters to Tab 1
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allReports.filter((r) => {
      if (desa !== "all" && r.kodeDesa !== desa) return false;
      if (subsektor !== "all" && r.subsektor !== subsektor) return false;
      if (poktan !== "all" && r.namaPoktan !== poktan) return false;
      if (!term) return true;
      return (
        r.namaPoktan.toLowerCase().includes(term) ||
        r.kodeDesa.toLowerCase().includes(term) ||
        r.subsektor.toLowerCase().includes(term) ||
        r.komoditasMT1.toLowerCase().includes(term) ||
        r.komoditasMT2.toLowerCase().includes(term) ||
        r.komoditasMT3.toLowerCase().includes(term)
      );
    });
  }, [allReports, q, desa, subsektor, poktan]);

  // Totals for summary cards
  const totals = useMemo(() => {
    let petani = 0, luas = 0, total = 0;
    for (const r of filtered) {
      petani += r.petaniCount;
      luas += r.luasLahanMT1 + r.luasLahanMT2 + r.luasLahanMT3;
      total +=
        r.pupukUreaMT1 + r.pupukUreaMT2 + r.pupukUreaMT3 +
        r.pupukNpkMT1 + r.pupukNpkMT2 + r.pupukNpkMT3 +
        r.pupukNpkFormulaMT1 + r.pupukNpkFormulaMT2 + r.pupukNpkFormulaMT3 +
        r.pupukOrganikMT1 + r.pupukOrganikMT2 + r.pupukOrganikMT3 +
        r.pupukZaMT1 + r.pupukZaMT2 + r.pupukZaMT3;
    }
    return { petani, luas, total };
  }, [filtered]);

  // ===== Tab 2: Realisasi & Sisa =====
  const allRealisasi = useMemo(() => {
    if (!data || !penyaluran) return [];
    return aggregateRealisasiByPoktan(data, penyaluran);
  }, [data, penyaluran]);

  const filteredRealisasi = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allRealisasi.filter((r) => {
      if (desa !== "all" && r.kodeDesa !== desa) return false;
      if (subsektor !== "all" && r.subsektor !== subsektor) return false;
      if (poktan !== "all" && r.namaPoktan !== poktan) return false;
      if (!term) return true;
      return (
        r.namaPoktan.toLowerCase().includes(term) ||
        r.kodeDesa.toLowerCase().includes(term) ||
        r.subsektor.toLowerCase().includes(term)
      );
    });
  }, [allRealisasi, q, desa, subsektor, poktan]);

  const realisasiTotals = useMemo(() => {
    let petani = 0, kuota = 0, tebus = 0, habisCount = 0;
    for (const r of filteredRealisasi) {
      petani += r.petaniCount;
      kuota += r.kuotaUrea + r.kuotaNpk + r.kuotaNpkFormula + r.kuotaOrganik;
      tebus += r.tebusUrea + r.tebusNpk + r.tebusNpkFormula + r.tebusOrganik;
      const sisa = r.sisaUrea + r.sisaNpk + r.sisaNpkFormula + r.sisaOrganik;
      if (sisa <= 0) habisCount += 1;
    }
    return { petani, kuota, tebus, sisa: kuota - tebus, habisCount };
  }, [filteredRealisasi]);

  const numR = (v: number) => (v !== 0 ? formatNumber(Math.round(v)) : "-");

  // Summary counts by Desa
  const desaCounts = useMemo(() => {
    if (!data) return { Posi: { petani: 0, poktan: 0 }, Tiromanda: { petani: 0, poktan: 0 } };
    const pPoktans = new Set(data.filter((d) => d.kodeDesa === "Posi").map((d) => d.namaPoktan));
    const tPoktans = new Set(data.filter((d) => d.kodeDesa === "Tiromanda").map((d) => d.namaPoktan));
    return {
      Posi: {
        petani: data.filter((d) => d.kodeDesa === "Posi").length,
        poktan: pPoktans.size,
      },
      Tiromanda: {
        petani: data.filter((d) => d.kodeDesa === "Tiromanda").length,
        poktan: tPoktans.size,
      },
    };
  }, [data]);

  return (
    <div className="space-y-5">
      {/* Village Quick Badges / Summary */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" /> Wilayah Desa (Header Kode Desa):
        </span>
        <button
          onClick={() => { setDesa(desa === "Posi" ? "all" : "Posi"); setPoktan("all"); }}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border ${
            desa === "Posi"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-700/20"
              : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Desa Posi</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
            {desaCounts.Posi.poktan} Poktan • {desaCounts.Posi.petani} Petani
          </span>
        </button>

        <button
          onClick={() => { setDesa(desa === "Tiromanda" ? "all" : "Tiromanda"); setPoktan("all"); }}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border ${
            desa === "Tiromanda"
              ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-700/20"
              : "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Desa Tiromanda</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
            {desaCounts.Tiromanda.poktan} Poktan • {desaCounts.Tiromanda.petani} Petani
          </span>
        </button>

        {desa !== "all" && (
          <button
            onClick={() => { setDesa("all"); setPoktan("all"); }}
            className="text-xs font-medium text-muted-foreground underline hover:text-foreground"
          >
            Tampilkan Semua Desa
          </button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto bg-card p-1.5 shadow-soft">
          <TabsTrigger
            value="kuota"
            className="gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Wheat className="h-4 w-4" /> Kuota Pupuk (MT1 + MT2)
          </TabsTrigger>
          <TabsTrigger
            value="realisasi"
            className="gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Truck className="h-4 w-4" /> Penyaluran & Sisa Kuota
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: KUOTA ===== */}
        <TabsContent value="kuota" className="mt-5 space-y-5">
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Wilayah Desa</p>
                  <p className="text-base font-extrabold text-foreground">
                    {desa === "all" ? "Desa Posi & Tiromanda" : `Desa ${desa}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Kelompok Tani</p>
                  <p className="text-xl font-extrabold text-foreground">{filtered.length} <span className="text-xs font-medium text-muted-foreground">Poktan</span></p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-50 text-lime-700">
                  <Wheat className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Total Luas Lahan</p>
                  <p className="text-xl font-extrabold text-foreground">{formatNumber(totals.luas, 2)} <span className="text-xs font-medium text-muted-foreground">Ha</span></p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
                  <Scale className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Total Alokasi Pupuk</p>
                  <p className="text-xl font-extrabold text-foreground">
                    {formatNumber(Math.round(totals.total))} <span className="text-xs font-medium text-muted-foreground">Kg</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar with download */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Search */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cari poktan, desa, komoditas..."
                    className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Filter Desa */}
                <div>
                  <Select
                    value={desa}
                    onValueChange={(v) => {
                      setDesa(v);
                      setPoktan("all");
                    }}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Semua Desa" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="all">Semua Desa (Posi & Tiromanda)</SelectItem>
                      <SelectItem value="Posi">Desa Posi ({desaCounts.Posi.poktan} Poktan)</SelectItem>
                      <SelectItem value="Tiromanda">Desa Tiromanda ({desaCounts.Tiromanda.poktan} Poktan)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Subsektor */}
                <div>
                  <Select
                    value={subsektor}
                    onValueChange={(v) => {
                      setSubsektor(v);
                      setPoktan("all");
                    }}
                  >
                    <SelectTrigger className="h-10 w-full">
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

                {/* Filter Poktan */}
                <div>
                  <Select value={poktan} onValueChange={(v) => setPoktan(v)}>
                    <SelectTrigger className="h-10 w-full">
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

              {/* Dedicated Export PDF Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/80">
                <span className="text-xs font-medium text-muted-foreground">
                  Cetak Dokumen PDF Resmi:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => exportAlokasiPDF(allReports, "Posi", { subsektor, poktan })}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-soft transition-all hover:bg-emerald-700 active:scale-95"
                  >
                    <FileDown className="h-3.5 w-3.5" /> PDF Desa Posi
                  </button>

                  <button
                    onClick={() => exportAlokasiPDF(allReports, "Tiromanda", { subsektor, poktan })}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3.5 text-xs font-semibold text-white shadow-soft transition-all hover:bg-teal-700 active:scale-95"
                  >
                    <FileDown className="h-3.5 w-3.5" /> PDF Desa Tiromanda
                  </button>

                  <button
                    onClick={() =>
                      exportAlokasiPDF(
                        allReports,
                        desa === "Posi" ? "Posi" : desa === "Tiromanda" ? "Tiromanda" : "both",
                        { subsektor, poktan }
                      )
                    }
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-3.5 text-xs font-semibold text-white shadow-soft transition-all hover:bg-slate-700 active:scale-95"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    {desa === "all" ? "PDF 2 Desa (Posi & Tiromanda)" : `PDF ${desa}`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <Wheat className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-900">
                Laporan Kuota Pupuk per Kelompok Tani (Poktan) & Desa
              </p>
              <p className="mt-0.5 text-[13px] text-emerald-800/80">
                Kolom <span className="font-semibold">Desa</span> diambil langsung dari header <span className="font-semibold">Kode Desa</span> pada data petani. Dokumen PDF tersedia terpisah untuk <span className="font-semibold text-emerald-900">Desa Posi</span> dan <span className="font-semibold text-teal-900">Desa Tiromanda</span>.
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full min-w-[1580px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">No</th>
                    <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Poktan</th>
                    <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Desa</th>
                    <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subsektor</th>
                    <th colSpan={7} className="border-r border-border bg-emerald-600/90 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Musim Tanam 1 (MT1)</th>
                    <th colSpan={7} className="border-r border-border bg-teal-600/90 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Musim Tanam 2 (MT2)</th>
                    <th colSpan={6} className="bg-emerald-800 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Total (MT1 + MT2)</th>
                  </tr>
                  <tr className="border-b border-border bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {Array.from({ length: 2 }).map((_, gi) => (
                      <Fragment key={gi}>
                        <th className="border-r border-border px-3 py-2">Komoditas</th>
                        <th className="border-r border-border px-3 py-2 text-right">Luas (Ha)</th>
                        <th className="border-r border-border px-3 py-2 text-right">Urea</th>
                        <th className="border-r border-border px-3 py-2 text-right">NPK</th>
                        <th className="border-r border-border px-3 py-2 text-right">NPK Form.</th>
                        <th className="border-r border-border px-3 py-2 text-right">Organik</th>
                        <th className="border-r border-border px-3 py-2 text-right">ZA</th>
                      </Fragment>
                    ))}
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
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 23 }).map((__, j) => (
                          <td key={j} className="px-3 py-4">
                            <div className="h-3.5 animate-pulse rounded bg-muted/70" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={23} className="px-4 py-16">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted">
                            <FileX2 className="h-7 w-7 text-muted-foreground" />
                          </span>
                          <p className="text-sm font-semibold text-foreground">Tidak ada data ditemukan</p>
                          <p className="max-w-xs text-xs text-muted-foreground">
                            Coba ubah kata kunci pencarian atau filter yang dipilih.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r, i) => {
                      const isPosi = r.kodeDesa.toLowerCase().includes("posi");
                      return (
                        <tr key={i} className="transition-colors hover:bg-accent/40">
                          <td className="border-r border-border px-3 py-3 text-sm text-muted-foreground">{i + 1}</td>
                          <td className="border-r border-border px-3 py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{r.namaPoktan}</span>
                              <span className="text-[10px] text-muted-foreground">{r.petaniCount} petani</span>
                            </div>
                          </td>
                          <td className="border-r border-border px-3 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                isPosi
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-teal-100 text-teal-800"
                              }`}
                            >
                              {r.kodeDesa}
                            </span>
                          </td>
                          <td className="border-r border-border px-3 py-3">
                            <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                              {r.subsektor || "-"}
                            </span>
                          </td>
                          {(["MT1", "MT2"] as const).map((mt) => {
                            const kom = mt === "MT1" ? r.komoditasMT1 : r.komoditasMT2;
                            const ll = mt === "MT1" ? r.luasLahanMT1 : r.luasLahanMT2;
                            const u = mt === "MT1" ? r.pupukUreaMT1 : r.pupukUreaMT2;
                            const n = mt === "MT1" ? r.pupukNpkMT1 : r.pupukNpkMT2;
                            const nf = mt === "MT1" ? r.pupukNpkFormulaMT1 : r.pupukNpkFormulaMT2;
                            const o = mt === "MT1" ? r.pupukOrganikMT1 : r.pupukOrganikMT2;
                            const z = mt === "MT1" ? r.pupukZaMT1 : r.pupukZaMT2;
                            return (
                              <Fragment key={mt}>
                                <td className="border-r border-border px-3 py-3">
                                  {kom ? (
                                    <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{kom}</span>
                                  ) : (
                                    <span className="text-muted-foreground/40">-</span>
                                  )}
                                </td>
                                <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs text-foreground">{ll > 0 ? formatHa(ll) : "-"}</td>
                                <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-sky-700">{num(u)}</td>
                                <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-violet-700">{num(n)}</td>
                                <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-amber-700">{num(nf)}</td>
                                <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-lime-700">{num(o)}</td>
                                <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-rose-700">{num(z)}</td>
                              </Fragment>
                            );
                          })}
                          {/* Total (MT1 + MT2) */}
                          <td className="whitespace-nowrap bg-emerald-50/40 px-3 py-3 text-right text-xs font-bold text-foreground">
                            {r.luasLahanMT1 + r.luasLahanMT2 > 0 ? formatHa(r.luasLahanMT1 + r.luasLahanMT2) : "-"}
                          </td>
                          <td className="whitespace-nowrap bg-emerald-50/40 px-3 py-3 text-right text-xs font-extrabold text-sky-700">{num(r.pupukUreaMT1 + r.pupukUreaMT2)}</td>
                          <td className="whitespace-nowrap bg-emerald-50/40 px-3 py-3 text-right text-xs font-extrabold text-violet-700">{num(r.pupukNpkMT1 + r.pupukNpkMT2)}</td>
                          <td className="whitespace-nowrap bg-emerald-50/40 px-3 py-3 text-right text-xs font-extrabold text-amber-700">{num(r.pupukNpkFormulaMT1 + r.pupukNpkFormulaMT2)}</td>
                          <td className="whitespace-nowrap bg-emerald-50/40 px-3 py-3 text-right text-xs font-extrabold text-lime-700">{num(r.pupukOrganikMT1 + r.pupukOrganikMT2)}</td>
                          <td className="whitespace-nowrap bg-emerald-50/40 px-3 py-3 text-right text-xs font-extrabold text-rose-700">{num(r.pupukZaMT1 + r.pupukZaMT2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/50 font-bold">
                      <td colSpan={4} className="border-r border-border px-3 py-3.5 text-xs text-foreground">
                        TOTAL REKAPITULASI ({filtered.length} Poktan, {totals.petani} Petani)
                      </td>
                      <td className="border-r border-border px-3 py-3.5 text-center text-xs">-</td>
                      <td className="border-r border-border px-3 py-3.5 text-right text-xs text-foreground">{formatNumber(totals.luas, 2)}</td>
                      <td colSpan={5} className="border-r border-border px-3 py-3.5 text-center text-xs text-muted-foreground">—</td>
                      <td className="border-r border-border px-3 py-3.5 text-center text-xs">-</td>
                      <td colSpan={6} className="border-r border-border px-3 py-3.5 text-center text-xs text-muted-foreground">—</td>
                      <td className="px-3 py-3.5 text-right text-xs font-extrabold text-emerald-800" colSpan={6}>
                        {formatNumber(Math.round(totals.total))} Kg Pupuk
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ===== TAB 2: REALISASI & SISA ===== */}
        <TabsContent value="realisasi" className="mt-5 space-y-5">
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Wilayah Desa</p>
                  <p className="text-base font-extrabold text-foreground">
                    {desa === "all" ? "Desa Posi & Tiromanda" : `Desa ${desa}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700">
                  <Wheat className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Total Kuota (MT1 + MT2)</p>
                  <p className="text-xl font-extrabold text-foreground">{formatNumber(Math.round(realisasiTotals.kuota))} <span className="text-xs font-medium text-muted-foreground">Kg</span></p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
                  <Truck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Total Realisasi Tebus</p>
                  <p className="text-xl font-extrabold text-amber-700">{formatNumber(Math.round(realisasiTotals.tebus))} <span className="text-xs font-medium text-muted-foreground">Kg</span></p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <Scale className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Total Sisa Kuota</p>
                  <p className={`text-xl font-extrabold ${realisasiTotals.sisa < 0 ? "text-rose-700" : "text-teal-700"}`}>
                    {formatNumber(Math.round(realisasiTotals.sisa))} <span className="text-xs font-medium text-muted-foreground">Kg</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar with download */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cari poktan, desa, subsektor..."
                    className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <Select
                    value={desa}
                    onValueChange={(v) => {
                      setDesa(v);
                      setPoktan("all");
                    }}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Semua Desa" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="all">Semua Desa (Posi & Tiromanda)</SelectItem>
                      <SelectItem value="Posi">Desa Posi ({desaCounts.Posi.poktan} Poktan)</SelectItem>
                      <SelectItem value="Tiromanda">Desa Tiromanda ({desaCounts.Tiromanda.poktan} Poktan)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select
                    value={subsektor}
                    onValueChange={(v) => {
                      setSubsektor(v);
                      setPoktan("all");
                    }}
                  >
                    <SelectTrigger className="h-10 w-full">
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

                <div>
                  <Select value={poktan} onValueChange={(v) => setPoktan(v)}>
                    <SelectTrigger className="h-10 w-full">
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

              {/* Dedicated Export PDF Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/80">
                <span className="text-xs font-medium text-muted-foreground">
                  Cetak Dokumen Realisasi & Sisa:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => exportRealisasiPDF(allRealisasi, "Posi", { subsektor, poktan })}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-soft transition-all hover:bg-emerald-700 active:scale-95"
                  >
                    <FileDown className="h-3.5 w-3.5" /> PDF Desa Posi
                  </button>

                  <button
                    onClick={() => exportRealisasiPDF(allRealisasi, "Tiromanda", { subsektor, poktan })}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3.5 text-xs font-semibold text-white shadow-soft transition-all hover:bg-teal-700 active:scale-95"
                  >
                    <FileDown className="h-3.5 w-3.5" /> PDF Desa Tiromanda
                  </button>

                  <button
                    onClick={() =>
                      exportRealisasiPDF(
                        allRealisasi,
                        desa === "Posi" ? "Posi" : desa === "Tiromanda" ? "Tiromanda" : "both",
                        { subsektor, poktan }
                      )
                    }
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-3.5 text-xs font-semibold text-white shadow-soft transition-all hover:bg-slate-700 active:scale-95"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    {desa === "all" ? "PDF 2 Desa (Posi & Tiromanda)" : `PDF ${desa}`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <Scale className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-900">
                Laporan Realisasi Penyaluran & Sisa Kuota per Poktan & Desa
              </p>
              <p className="mt-0.5 text-[13px] text-emerald-800/80">
                Sisa Kuota = <span className="font-semibold">Kuota (MT1 + MT2)</span> − <span className="font-semibold">Realisasi Tebus</span>.
                Status <span className="font-semibold text-teal-700">SISA</span> = masih ada kuota tersisa, <span className="font-semibold text-amber-700">LENGKAP</span> = kuota pas habis, <span className="font-semibold text-rose-700">MINUS</span> = tebus melebihi kuota.
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full min-w-[1380px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">No</th>
                    <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Poktan</th>
                    <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Desa</th>
                    <th rowSpan={2} className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subsektor</th>
                    <th colSpan={4} className="border-r border-border bg-emerald-600/90 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Kuota (MT1 + MT2)</th>
                    <th colSpan={4} className="border-r border-border bg-amber-600/90 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Realisasi Tebus</th>
                    <th colSpan={4} className="border-r border-border bg-teal-600/90 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">Sisa Kuota</th>
                    <th rowSpan={2} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  </tr>
                  <tr className="border-b border-border bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="border-r border-border px-3 py-2 text-right">Urea</th>
                    <th className="border-r border-border px-3 py-2 text-right">NPK</th>
                    <th className="border-r border-border px-3 py-2 text-right">NPK Form.</th>
                    <th className="border-r border-border px-3 py-2 text-right">Organik</th>
                    <th className="border-r border-border px-3 py-2 text-right">Urea</th>
                    <th className="border-r border-border px-3 py-2 text-right">NPK</th>
                    <th className="border-r border-border px-3 py-2 text-right">NPK Form.</th>
                    <th className="border-r border-border px-3 py-2 text-right">Organik</th>
                    <th className="border-r border-border px-3 py-2 text-right">Urea</th>
                    <th className="border-r border-border px-3 py-2 text-right">NPK</th>
                    <th className="border-r border-border px-3 py-2 text-right">NPK Form.</th>
                    <th className="border-r border-border px-3 py-2 text-right">Organik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 16 }).map((__, j) => (
                          <td key={j} className="px-3 py-4">
                            <div className="h-3.5 animate-pulse rounded bg-muted/70" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredRealisasi.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="px-4 py-16">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted">
                            <FileX2 className="h-7 w-7 text-muted-foreground" />
                          </span>
                          <p className="text-sm font-semibold text-foreground">Tidak ada data ditemukan</p>
                          <p className="max-w-xs text-xs text-muted-foreground">
                            Coba ubah kata kunci pencarian atau filter yang dipilih.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRealisasi.map((r, i) => {
                      const totalSisa = r.sisaUrea + r.sisaNpk + r.sisaNpkFormula + r.sisaOrganik;
                      const isMinus = totalSisa < 0;
                      const isLengkap = totalSisa === 0;
                      const isPosi = r.kodeDesa.toLowerCase().includes("posi");
                      const sisaCls = (v: number) =>
                        v < 0
                          ? "text-rose-700 bg-rose-50"
                          : v === 0
                          ? "text-amber-700 bg-amber-50/50"
                          : "text-teal-700 bg-teal-50/40";
                      const statusBadge = isMinus ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          <AlertTriangle className="h-3 w-3" /> MINUS
                        </span>
                      ) : isLengkap ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <CheckCircle2 className="h-3 w-3" /> LENGKAP
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                          <Scale className="h-3 w-3" /> SISA
                        </span>
                      );
                      return (
                        <tr
                          key={i}
                          className={`transition-colors hover:bg-accent/40 ${
                            isMinus ? "bg-rose-50/30" : isLengkap ? "bg-amber-50/20" : ""
                          }`}
                        >
                          <td className="border-r border-border px-3 py-3 text-sm text-muted-foreground">{i + 1}</td>
                          <td className="border-r border-border px-3 py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{r.namaPoktan}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {r.petaniCount} petani{r.transaksiCount > 0 && ` · ${r.transaksiCount}x tebus`}
                              </span>
                            </div>
                          </td>
                          <td className="border-r border-border px-3 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                isPosi
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-teal-100 text-teal-800"
                              }`}
                            >
                              {r.kodeDesa}
                            </span>
                          </td>
                          <td className="border-r border-border px-3 py-3">
                            <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                              {r.subsektor || "-"}
                            </span>
                          </td>
                          {/* Kuota */}
                          <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-foreground">{numR(r.kuotaUrea)}</td>
                          <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-foreground">{numR(r.kuotaNpk)}</td>
                          <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-foreground">{numR(r.kuotaNpkFormula)}</td>
                          <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-foreground">{numR(r.kuotaOrganik)}</td>
                          {/* Tebus */}
                          <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-amber-700">{numR(r.tebusUrea)}</td>
                          <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-amber-700">{numR(r.tebusNpk)}</td>
                          <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-amber-700">{numR(r.tebusNpkFormula)}</td>
                          <td className="border-r border-border whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-amber-700">{numR(r.tebusOrganik)}</td>
                          {/* Sisa */}
                          <td className={`whitespace-nowrap px-3 py-3 text-right text-xs font-extrabold ${sisaCls(r.sisaUrea)}`}>{numR(r.sisaUrea)}</td>
                          <td className={`whitespace-nowrap px-3 py-3 text-right text-xs font-extrabold ${sisaCls(r.sisaNpk)}`}>{numR(r.sisaNpk)}</td>
                          <td className={`whitespace-nowrap px-3 py-3 text-right text-xs font-extrabold ${sisaCls(r.sisaNpkFormula)}`}>{numR(r.sisaNpkFormula)}</td>
                          <td className={`whitespace-nowrap border-r border-border px-3 py-3 text-right text-xs font-extrabold ${sisaCls(r.sisaOrganik)}`}>{numR(r.sisaOrganik)}</td>
                          <td className="px-3 py-3 text-center">{statusBadge}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredRealisasi.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/50 font-bold">
                      <td colSpan={4} className="border-r border-border px-3 py-3.5 text-xs text-foreground">
                        TOTAL REKAPITULASI ({filteredRealisasi.length} Poktan, {realisasiTotals.petani} Petani)
                      </td>
                      <td className="border-r border-border px-3 py-3.5 text-right text-xs">{formatNumber(Math.round(realisasiTotals.kuota))}</td>
                      <td colSpan={3} className="border-r border-border px-3 py-3.5 text-center text-xs text-muted-foreground">—</td>
                      <td className="border-r border-border px-3 py-3.5 text-right text-xs text-amber-700">{formatNumber(Math.round(realisasiTotals.tebus))}</td>
                      <td colSpan={3} className="border-r border-border px-3 py-3.5 text-center text-xs text-muted-foreground">—</td>
                      <td className={`px-3 py-3.5 text-right text-xs font-extrabold ${realisasiTotals.sisa < 0 ? "text-rose-700" : "text-teal-700"}`} colSpan={4}>
                        {formatNumber(Math.round(realisasiTotals.sisa))} Kg Sisa
                      </td>
                      <td className="px-3 py-3.5 text-center text-xs text-muted-foreground">—</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
