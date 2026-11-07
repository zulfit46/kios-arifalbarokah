import { NextResponse } from "next/server";
import type { Penyaluran } from "@/lib/types";

const SHEET_ID = "1FljqsjnhOnaUq3dxDw49_BwNQ-0RVPnho3qFWhESLfw";
const SHEET_NAME = "penyaluran";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

// In-memory cache (5 minutes)
let cache: { data: Penyaluran[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

/** Quote-aware CSV parser. */
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
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ",") { row.push(field); field = ""; i++; continue; }
    if (ch === "\r") { i++; continue; }
    if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += ch;
    i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
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
  return (s || "").trim();
}

function buildPenyaluran(rows: string[][]): Penyaluran[] {
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.findIndex((h) => h === name);
  const H = {
    nama: idx("Nama"),
    nik: idx("NIK"),
    poktan: idx("Poktan"),
    tanggalTebus: idx("Tanggal Tebus"),
    urea: idx("Urea"),
    npk: idx("NPK"),
    npkFormula: idx("NPK Formula Khusus"),
    organik: idx("Organik"),
    bulan: idx("bulan"),
  };
  const g = (r: string[], key: keyof typeof H) => {
    const i = H[key];
    return i >= 0 ? r[i] ?? "" : "";
  };

  const out: Penyaluran[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => !c.trim())) continue;
    if (!cleanStr(g(row, "nama"))) continue;
    out.push({
      nama: cleanStr(g(row, "nama")),
      nik: cleanStr(g(row, "nik")),
      poktan: cleanStr(g(row, "poktan")),
      tanggalTebus: cleanStr(g(row, "tanggalTebus")),
      urea: parseNum(g(row, "urea")),
      npk: parseNum(g(row, "npk")),
      npkFormulaKhusus: parseNum(g(row, "npkFormula")),
      organik: parseNum(g(row, "organik")),
      bulan: cleanStr(g(row, "bulan")),
    });
  }
  return out;
}

export async function getPenyaluran(): Promise<Penyaluran[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return cache.data;
  }
  const res = await fetch(CSV_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Gagal memuat data penyaluran (${res.status})`);
  const text = await res.text();
  const rows = parseCSV(text);
  const data = buildPenyaluran(rows);
  cache = { data, ts: Date.now() };
  return data;
}

export async function GET() {
  try {
    const data = await getPenyaluran();
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
