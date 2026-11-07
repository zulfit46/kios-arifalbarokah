export interface Petani {
  namaPenyuluh: string;
  kodeDesa: string;
  kodeKios: string;
  namaKios: string;
  gapoktan: string;
  namaPoktan: string;
  namaPetani: string;
  ktp: string;
  tempatLahir: string;
  tanggalLahir: string;
  namaIbuKandung: string;
  alamat: string;
  subsektor: string;
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

export interface DashboardStats {
  totalPetani: number;
  totalPoktan: number;
  totalLuasLahan: number;
  totalUrea: number;
  totalNpk: number;
  totalNpkFormula: number;
  totalOrganik: number;
  totalZa: number;
  bySubsektor: { name: string; value: number }[];
  byKomoditas: { name: string; value: number }[];
  byPoktan: { name: string; petani: number; luas: number }[];
  pupukPerMusim: {
    musim: string;
    urea: number;
    npk: number;
    npkFormula: number;
    organik: number;
    za: number;
  }[];
}

export interface Penyaluran {
  nama: string;
  nik: string;
  poktan: string;
  tanggalTebus: string;
  urea: number;
  npk: number;
  npkFormulaKhusus: number;
  organik: number;
  bulan: string;
}
