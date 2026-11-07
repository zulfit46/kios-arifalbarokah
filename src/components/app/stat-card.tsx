"use client";

import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "emerald",
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "emerald" | "teal" | "lime" | "amber" | "cyan";
  hint?: string;
}) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    teal: "bg-teal-50 text-teal-700",
    lime: "bg-lime-50 text-lime-700",
    amber: "bg-amber-50 text-amber-700",
    cyan: "bg-cyan-50 text-cyan-700",
  };
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "grid h-11 w-11 place-items-center rounded-xl",
            tones[tone]
          )}
        >
          <Icon className="h-[22px] w-[22px]" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
      </div>
      <p className="mt-4 text-[13px] font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-extrabold tracking-tight text-foreground">
          {value}
        </span>
        {unit && <span className="text-sm font-semibold text-muted-foreground">{unit}</span>}
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}
