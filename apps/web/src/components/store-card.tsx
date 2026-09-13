"use client";

import { ArrowUpRight, Clock3, MapPin, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { getAppleBuyUrl } from "@/lib/apple";
import { localizePickupMessage, useI18n } from "@/lib/i18n";
import type { AvailabilityResult } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

export function StoreCard({ result, zip, range, index }: { result: AvailabilityResult; zip: string; range: number | "all"; index: number }) {
  const { locale, t } = useI18n();
  const productQuery = result.product.product_id.split("-")[0] ?? result.product.product_id;
  const detailsHref = `/stores/${result.store.id}?zip=${zip}&variant=${result.product.id}&product=${encodeURIComponent(productQuery)}&radius=${range}`;
  return (
    <article className="fade-up group grid gap-5 rounded-[1.75rem] border border-black/[.07] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-card sm:grid-cols-[1fr_auto] sm:p-6" style={{ animationDelay: `${index * 55}ms` }}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={detailsHref} className="text-lg font-semibold tracking-[-.02em] hover:underline">
            {result.store.name}
          </Link>
          <StatusBadge status={result.availability.status} />
        </div>
        <p className="mt-2 font-medium text-black/70">{localizePickupMessage(result.availability.pickup_message, locale)}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-black/45">
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{result.store.address}, {result.store.city}</span>
          <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{t("checked", { time: formatRelativeTime(result.availability.last_checked_at, locale) })}</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-4 sm:min-w-56 sm:flex-col sm:items-end">
        <span className="text-sm font-semibold tabular-nums">{t("milesShort", { distance: result.store.distance_miles.toFixed(1) })}</span>
        <div className="flex flex-col items-end gap-2">
          {result.availability.available && (
            <>
              <a
                href={getAppleBuyUrl(result.product)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/75"
              >
                <ShoppingBag className="h-4 w-4" />
                {t("orderAtApple")}
              </a>
              <span className="max-w-56 text-right text-[11px] leading-snug text-black/35">
                {t("pickupAtStore", { store: result.store.name })}
              </span>
            </>
          )}
          <Link href={detailsHref} className="flex items-center gap-1 text-sm font-semibold text-black/55 transition group-hover:text-black">
            {t("details")} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
