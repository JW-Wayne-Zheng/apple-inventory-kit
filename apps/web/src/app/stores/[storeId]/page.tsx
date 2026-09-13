"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock3, MapPin, Navigation, ShieldCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { getAppleBuyUrl } from "@/lib/apple";
import { localizePickupMessage, useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { StatusBadge } from "@/components/status-badge";

export default function StoreDetailPage() {
  const { locale, t } = useI18n();
  const params = useParams<{ storeId: string }>();
  const search = useSearchParams();
  const zip = search.get("zip") ?? "10001";
  const variant = search.get("variant") ?? "";
  const product = search.get("product") ?? "Apple";
  const radius = search.get("radius") ?? "25";
  const storeQuery = useQuery({ queryKey: ["store", params.storeId, zip], queryFn: () => api.getStore(params.storeId, zip) });
  const availabilityQuery = useQuery({ queryKey: ["availability", variant, zip], queryFn: () => api.getAvailability(variant, zip), enabled: Boolean(variant) });
  const availability = availabilityQuery.data?.results.find((item) => item.store.id === params.storeId);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5"><Logo /><div className="flex items-center gap-3"><span className="hidden items-center gap-2 text-xs font-medium text-black/40 sm:flex"><ShieldCheck className="h-4 w-4" />{t("independentTracker")}</span><LanguageSwitcher /></div></header>
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-12">
        <Link href={`/?product=${encodeURIComponent(product)}&variant=${variant}&zip=${zip}&radius=${radius}`} className="inline-flex items-center gap-2 text-sm font-semibold text-black/50 hover:text-black"><ArrowLeft className="h-4 w-4" />{t("backToResults")}</Link>
        {storeQuery.isLoading ? <div className="mt-8 h-80 animate-pulse rounded-[2rem] bg-white" /> : storeQuery.error ? <div className="mt-8 rounded-3xl bg-rose-50 p-6 text-rose-800">{storeQuery.error.message}</div> : storeQuery.data && (
          <>
            <section className="mt-8 overflow-hidden rounded-[2rem] border border-black/[.07] bg-white shadow-card">
              <div className="dot-grid relative h-52 bg-[#e5e6e2]"><div className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-ink text-white shadow-xl"><MapPin className="h-6 w-6" /></div></div>
              <div className="grid gap-8 p-7 sm:grid-cols-[1fr_auto] sm:p-10">
                <div><p className="text-xs font-bold uppercase tracking-[.14em] text-orchard">{t("retailStore")}</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em]">{storeQuery.data.name}</h1><p className="mt-4 flex items-center gap-2 text-black/55"><MapPin className="h-4 w-4" />{storeQuery.data.address}, {storeQuery.data.city}, {storeQuery.data.region} {storeQuery.data.postal_code}</p><p className="mt-2 flex items-center gap-2 text-black/55"><Clock3 className="h-4 w-4" />{storeQuery.data.hours?.summary ?? t("hoursUnavailable")}</p></div>
                <div className="sm:text-right"><p className="text-3xl font-semibold tabular-nums">{storeQuery.data.distance_miles.toFixed(1)}</p><p className="text-sm text-black/40">{t("milesAway")}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${storeQuery.data.address}, ${storeQuery.data.city}`)}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-mist"><Navigation className="h-4 w-4" />{t("directions")}</a></div>
              </div>
            </section>
            {availability && <section className="mt-6 rounded-[2rem] border border-black/[.07] bg-white p-7 sm:p-10"><div className="flex flex-wrap items-start justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-black/35">{t("currentPickupStatus")}</p><h2 className="mt-2 text-2xl font-semibold">{localizePickupMessage(availability.availability.pickup_message, locale)}</h2></div><div className="flex flex-col items-end gap-3"><StatusBadge status={availability.availability.status} />{availability.availability.available && <><a href={getAppleBuyUrl(availability.product)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black/75"><ShoppingBag className="h-4 w-4" />{t("orderAtApple")}</a><span className="max-w-64 text-right text-xs text-black/40">{t("pickupAtStore", { store: storeQuery.data.name })}</span></>}</div></div><p className="mt-6 border-t border-black/[.07] pt-5 text-sm text-black/45">SKU {availability.product.sku} · {t("lastChecked", { time: new Date(availability.availability.last_checked_at).toLocaleString(locale === "zh" ? "zh-CN" : "en-US") })}</p></section>}
          </>
        )}
      </main>
      <footer className="border-t border-black/[.07] px-5 py-8 text-center text-xs text-black/40">{t("footer")}</footer>
    </div>
  );
}
