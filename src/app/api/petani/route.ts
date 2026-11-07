import { NextResponse } from "next/server";
import type { DashboardStats, Petani } from "@/lib/types";

const SHEET_ID = "1FljqsjnhOnaUq3dxDw49_BwNQ-0RVPnho3qFWhESLfw";
const SHEET_NAME = "petani";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

// In-memory cache (5 minutes)
let cache: { data: Petani[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

/** Quote-aware CSV parser supporting quoted fields with commas & "" escapes. */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Parse Indonesian decimal numbers: "0,25" -> 0.25, "1.234,5" -> 1234.5 */
function parseNum(raw: string): number {
  if (!raw) return 0;
  const s = raw.trim().replace(/`/g, "").replace(/\s/g, "");
  if (!s || s === "-") return 0;
  let normalized: string;
  if (s.includes(",") && s.includes(".")) {
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    normalized = s.replace(",", ".");
  } else {
    normalized = s;
  }
  const n = Number(normalized);
  return isNaN(n) ? 0 : n;
}

function cleanStr(s: string): string {
  return (s || "").trim().replace(/^`/, "");
}

function buildPetani(rows: string[][]): Petani[] {
  if (rows.length < 2) return [];
  const header = rows[0];
  const idx = (name: string) => header.findIndex((h) => h.trim() === name);
  const H = {
    namaPenyuluh: idx("Nama Penyuluh"),
    kodeDesa: idx("Kode Desa"),
    kodeKios: idx("Kode Kios Pengecer"),
    namaKios: idx("Nama Kios Pengecer"),
    gapoktan: idx("Gapoktan"),
    namaPoktan: idx("Nama Poktan"),
    namaPetani: idx("Nama Petani"),
    ktp: idx("KTP"),
    tempatLahir: idx("Tempat Lahir"),
    tanggalLahir: idx("Tanggal Lahir"),
    namaIbuKandung: idx("Nama Ibu Kandung"),
    alamat: idx("Alamat"),
    subsektor: idx("Subsektor"),
    k1: idx("Komoditas MT1"),
    ll1: idx("Luas Lahan (Ha) MT1"),
    u1: idx("Pupuk Urea (Kg) MT1"),
    n1: idx("Pupuk NPK (Kg) MT1"),
    nf1: idx("Pupuk NPK Formula (Kg) MT1"),
    o1: idx("Pupuk Organik (Kg) MT1"),
    z1: idx("Pupuk ZA (Kg) MT1"),
    k2: idx("Komoditas MT2"),
    ll2: idx("Luas Lahan (Ha) MT2"),
    u2: idx("Pupuk Urea (Kg) MT2"),
    n2: idx("Pupuk NPK (Kg) MT2"),
    nf2: idx("Pupuk NPK Formula (Kg) MT2"),
    o2: idx("Pupuk Organik (Kg) MT2"),
    z2: idx("Pupuk ZA (Kg) MT2"),
    k3: idx("Komoditas MT3"),
    ll3: idx("Luas Lahan (Ha) MT3"),
    u3: idx("Pupuk Urea (Kg) MT3"),
    n3: idx("Pupuk NPK (Kg) MT3"),
    nf3: idx("Pupuk NPK Formula (Kg) MT3"),
    o3: idx("Pupuk Organik (Kg) MT3"),
    z3: idx("Pupuk ZA (Kg) MT3"),
  };
  const g = (r: string[], key: keyof typeof H) => {
    const i = H[key];
    return i >= 0 ? r[i] ?? "" : "";
  };

  const out: Petani[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => !c.trim())) continue;
    if (!cleanStr(g(row, "namaPetani"))) continue;
    out.push({
      namaPenyuluh: cleanStr(g(row, "namaPenyuluh")),
      kodeDesa: cleanStr(g(row, "kodeDesa")),
      kodeKios: cleanStr(g(row, "kodeKios")),
      namaKios: cleanStr(g(row, "namaKios")),
      gapoktan: cleanStr(g(row, "gapoktan")),
      namaPoktan: cleanStr(g(row, "namaPoktan")),
      namaPetani: cleanStr(g(row, "namaPetani")),
      ktp: cleanStr(g(row, "ktp")),
      tempatLahir: cleanStr(g(row, "tempatLahir")),
      tanggalLahir: cleanStr(g(row, "tanggalLahir")),
      namaIbuKandung: cleanStr(g(row, "namaIbuKandung")),
      alamat: cleanStr(g(row, "alamat")),
      subsektor: cleanStr(g(row, "subsektor")),
      komoditasMT1: cleanStr(g(row, "k1")),
      luasLahanMT1: parseNum(g(row, "ll1")),
      pupukUreaMT1: parseNum(g(row, "u1")),
      pupukNpkMT1: parseNum(g(row, "n1")),
      pupukNpkFormulaMT1: parseNum(g(row, "nf1")),
      pupukOrganikMT1: parseNum(g(row, "o1")),
      pupukZaMT1: parseNum(g(row, "z1")),
      komoditasMT2: cleanStr(g(row, "k2")),
      luasLahanMT2: parseNum(g(row, "ll2")),
      pupukUreaMT2: parseNum(g(row, "u2")),
      pupukNpkMT2: parseNum(g(row, "n2")),
      pupukNpkFormulaMT2: parseNum(g(row, "nf2")),
      pupukOrganikMT2: parseNum(g(row, "o2")),
      pupukZaMT2: parseNum(g(row, "z2")),
      komoditasMT3: cleanStr(g(row, "k3")),
      luasLahanMT3: parseNum(g(row, "ll3")),
      pupukUreaMT3: parseNum(g(row, "u3")),
      pupukNpkMT3: parseNum(g(row, "n3")),
      pupukNpkFormulaMT3: parseNum(g(row, "nf3")),
      pupukOrganikMT3: parseNum(g(row, "o3")),
      pupukZaMT3: parseNum(g(row, "z3")),
    });
  }
  return out;
}

export async function getPetani(): Promise<Petani[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return cache.data;
  }
  const res = await fetch(CSV_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Gagal memuat data spreadsheet (${res.status})`);
  const text = await res.text();
  const rows = parseCSV(text);
  const data = buildPetani(rows);
  cache = { data, ts: Date.now() };
  return data;
}

export function computeStats(data: Petani[]): DashboardStats {
  const poktanSet = new Set<string>();
  const subsektorMap = new Map<string, number>();
  const komoditasMap = new Map<string, number>();
  const poktanMap = new Map<string, { petani: number; luas: number }>();

  let totalLuas = 0;
  let totalUrea = 0;
  let totalNpk = 0;
  let totalNpkFormula = 0;
  let totalOrganik = 0;
  let totalZa = 0;
  const musim = {
    MT1: { urea: 0, npk: 0, npkFormula: 0, organik: 0, za: 0 },
    MT2: { urea: 0, npk: 0, npkFormula: 0, organik: 0, za: 0 },
    MT3: { urea: 0, npk: 0, npkFormula: 0, organik: 0, za: 0 },
  };

  for (const p of data) {
    if (p.namaPoktan) poktanSet.add(p.namaPoktan);
    const sub = p.subsektor || "Lainnya";
    subsektorMap.set(sub, (subsektorMap.get(sub) || 0) + 1);
    const kom = p.komoditasMT1 || p.komoditasMT2 || p.komoditasMT3 || "Lainnya";
    komoditasMap.set(kom, (komoditasMap.get(kom) || 0) + 1);

    const ll = p.luasLahanMT1 + p.luasLahanMT2 + p.luasLahanMT3;
    totalLuas += ll;
    totalUrea += p.pupukUreaMT1 + p.pupukUreaMT2 + p.pupukUreaMT3;
    totalNpk += p.pupukNpkMT1 + p.pupukNpkMT2 + p.pupukNpkMT3;
    totalNpkFormula += p.pupukNpkFormulaMT1 + p.pupukNpkFormulaMT2 + p.pupukNpkFormulaMT3;
    totalOrganik += p.pupukOrganikMT1 + p.pupukOrganikMT2 + p.pupukOrganikMT3;
    totalZa += p.pupukZaMT1 + p.pupukZaMT2 + p.pupukZaMT3;

    musim.MT1.urea += p.pupukUreaMT1; musim.MT1.npk += p.pupukNpkMT1; musim.MT1.npkFormula += p.pupukNpkFormulaMT1; musim.MT1.organik += p.pupukOrganikMT1; musim.MT1.za += p.pupukZaMT1;
    musim.MT2.urea += p.pupukUreaMT2; musim.MT2.npk += p.pupukNpkMT2; musim.MT2.npkFormula += p.pupukNpkFormulaMT2; musim.MT2.organik += p.pupukOrganikMT2; musim.MT2.za += p.pupukZaMT2;
    musim.MT3.urea += p.pupukUreaMT3; musim.MT3.npk += p.pupukNpkMT3; musim.MT3.npkFormula += p.pupukNpkFormulaMT3; musim.MT3.organik += p.pupukOrganikMT3; musim.MT3.za += p.pupukZaMT3;

    const key = p.namaPoktan || "Tanpa Poktan";
    const cur = poktanMap.get(key) || { petani: 0, luas: 0 };
    cur.petani += 1;
    cur.luas += ll;
    poktanMap.set(key, cur);
  }

  return {
    totalPetani: data.length,
    totalPoktan: poktanSet.size,
    totalLuasLahan: totalLuas,
    totalUrea,
    totalNpk,
    totalNpkFormula,
    totalOrganik,
    totalZa,
    bySubsektor: [...subsektorMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    byKomoditas: [...komoditasMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    byPoktan: [...poktanMap.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.petani - a.petani),
    pupukPerMusim: [
      { musim: "MT1", ...musim.MT1 },
      { musim: "MT2", ...musim.MT2 },
      { musim: "MT3", ...musim.MT3 },
    ],
  };
}

export async function GET() {
  try {
    const data = await getPetani();
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
