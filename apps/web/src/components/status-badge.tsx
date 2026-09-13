"use client";

import { Check, CircleEllipsis, Clock3, X } from "lucide-react";
import type { AvailabilityStatus } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const config = {
  AVAILABLE: { label: "available" as const, icon: Check, style: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
  LIMITED: { label: "limited" as const, icon: Clock3, style: "bg-amber-50 text-amber-700 ring-amber-600/15" },
  UNAVAILABLE: { label: "unavailable" as const, icon: X, style: "bg-rose-50 text-rose-700 ring-rose-600/15" },
  UNKNOWN: { label: "unknown" as const, icon: CircleEllipsis, style: "bg-slate-100 text-slate-600 ring-slate-600/10" },
};

export function StatusBadge({ status }: { status: AvailabilityStatus }) {
  const { t } = useI18n();
  const item = config[status];
  const Icon = item.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", item.style)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {t(item.label)}
    </span>
  );
}
