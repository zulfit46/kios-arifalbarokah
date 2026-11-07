"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardStats, Penyaluran, Petani } from "@/lib/types";

export function usePetani() {
  return useQuery<Petani[]>({
    queryKey: ["petani"],
    queryFn: async () => {
      const res = await fetch("/api/petani");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal memuat data");
      return json.data as Petani[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePenyaluran() {
  return useQuery<Penyaluran[]>({
    queryKey: ["penyaluran"],
    queryFn: async () => {
      const res = await fetch("/api/penyaluran");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal memuat data penyaluran");
      return json.data as Penyaluran[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStats() {
  return useQuery<DashboardStats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal memuat statistik");
      return json.stats as DashboardStats;
    },
    staleTime: 5 * 60 * 1000,
  });
}
