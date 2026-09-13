"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownUp,
  BellRing,
  Grid2X2,
  List,
  Map,
  MapPin,
  Pause,
  ShieldCheck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  localizePickupMessage,
  localizeProductDescription,
  useI18n,
} from "@/lib/i18n";
import { zipSchema } from "@/lib/search";
import type { Product, ProductVariant } from "@/lib/types";
import { AlertForm } from "./alert-form";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { ProductGlyph } from "./product-glyph";
import { StoreCard } from "./store-card";
import { StoreMap } from "./store-map";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { VariantPicker } from "./variant-picker";

const rank = { AVAILABLE: 0, LIMITED: 1, UNKNOWN: 2, UNAVAILABLE: 3 };
type DistanceRange = 25 | 50 | 100 | "all";

function parseDistanceRange(value: string | null): DistanceRange {
  if (value === "25" || value === "50" || value === "100") {
    return Number(value) as DistanceRange;
  }
  return value === "all" ? "all" : 25;
}

export function InventoryExplorer() {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialZip = searchParams.get("zip") ?? "";
  const [zip, setZip] = useState(initialZip);
  const [submittedZip, setSubmittedZip] = useState(initialZip);
  const [submitted, setSubmitted] = useState(
    zipSchema.safeParse(initialZip).success,
  );
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState(searchParams.get("variant") ?? "");
  const [zipError, setZipError] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [range, setRange] = useState<DistanceRange>(() =>
    parseDistanceRange(searchParams.get("radius")),
  );
  const [sort, setSort] = useState<"distance" | "availability">("distance");
  const [view, setView] = useState<"list" | "map">("list");
  const [isWatching, setIsWatching] = useState(false);
  const [secondsUntilCheck, setSecondsUntilCheck] = useState(60);
  const previousAvailableStores = useRef<Set<string> | null>(null);

  const productsQuery = useQuery({
    queryKey: ["products", "iphone"],
    queryFn: () => api.searchProducts("iPhone"),
    enabled: submitted,
  });
  const products = productsQuery.data ?? [];
  const selectedProduct = products.find((item) => item.id === selectedProductId) ?? products[0];
  const selectedVariant = selectedProduct?.variants.find((item) => item.id === selectedVariantId) ?? selectedProduct?.variants[0];

  useEffect(() => {
    if (!submitted || !selectedVariant) return;
    const params = new URLSearchParams({
      product: "iphone",
      variant: selectedVariant.id,
      zip: submittedZip,
      radius: String(range),
    });
    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [range, router, selectedVariant, submitted, submittedZip]);

  const availabilityQuery = useQuery({
    queryKey: ["availability", selectedVariant?.id, submittedZip],
    queryFn: () => api.getAvailability(selectedVariant!.id, submittedZip),
    enabled:
      submitted &&
      Boolean(selectedVariant) &&
      zipSchema.safeParse(submittedZip).success,
    refetchInterval: isWatching ? 60_000 : false,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!isWatching) return;
    const timer = window.setInterval(
      () => setSecondsUntilCheck((seconds) => (seconds <= 1 ? 60 : seconds - 1)),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, [isWatching]);

  useEffect(() => {
    if (!isWatching || !availabilityQuery.data) return;
    const available = availabilityQuery.data.results.filter((item) => item.availability.available);
    const currentStores = new Set(available.map((item) => item.store.id));
    const newlyAvailable = available.filter(
      (item) => !previousAvailableStores.current?.has(item.store.id),
    );
    if (
      newlyAvailable.length > 0 &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      new Notification(t("stockFound"), {
        body: `${newlyAvailable[0].store.name}: ${localizePickupMessage(newlyAvailable[0].availability.pickup_message, locale)}`,
      });
    }
    previousAvailableStores.current = currentStores;
  }, [availabilityQuery.data, isWatching, locale, t]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!zipSchema.safeParse(zip).success) {
      setZipError(t("invalidZip"));
      return;
    }
    setZipError("");
    setIsWatching(false);
    previousAvailableStores.current = null;
    if (submitted && zip === submittedZip) {
      void availabilityQuery.refetch();
    }
    setSubmittedZip(zip);
    setSubmitted(true);
  }

  async function toggleWatch() {
    if (isWatching) {
      setIsWatching(false);
      previousAvailableStores.current = null;
      return;
    }
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    setSecondsUntilCheck(60);
    setIsWatching(true);
  }

  const visibleResults = useMemo(() => {
    const rows = [...(availabilityQuery.data?.results ?? [])];
    const withinRange =
      range === "all"
        ? rows
        : rows.filter((item) => item.store.distance_miles <= range);
    const filtered = availableOnly
      ? withinRange.filter((item) => item.availability.available)
      : withinRange;
    return filtered.sort((a, b) =>
      sort === "distance"
        ? a.store.distance_miles - b.store.distance_miles
        : rank[a.availability.status] - rank[b.availability.status] || a.store.distance_miles - b.store.distance_miles,
    );
  }, [availabilityQuery.data, availableOnly, range, sort]);
  const locationChangePending = submitted && zip !== submittedZip;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <Logo />
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-xs font-medium text-black/45 sm:flex"><ShieldCheck className="h-4 w-4" />{t("tracker")}</div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24">
        <section className={`transition-all ${submitted ? "pb-10 pt-10" : "pb-20 pt-24 sm:pt-32"}`}>
          <div className={submitted ? "max-w-3xl" : "mx-auto max-w-3xl text-center"}>
            <p className="mb-4 text-xs font-bold uppercase tracking-[.22em] text-orchard">{t("eyebrow")}</p>
            <h1 className={`${submitted ? "text-4xl" : "text-5xl sm:text-7xl"} font-semibold leading-[.98] tracking-[-.055em]`}>
              {t("heroLineOne")}<br />{t("heroLineTwo")}
            </h1>
            {!submitted && <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-black/50">{t("heroBody")}</p>}
          </div>

          <form onSubmit={submit} className={`mt-9 grid max-w-xl gap-3 rounded-[1.75rem] border border-black/[.07] bg-white p-3 shadow-card sm:grid-cols-[1fr_auto] ${submitted ? "" : "mx-auto"}`}>
            <label className="relative">
              <span className="sr-only">{t("zipCode")}</span>
              <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/35" />
              <Input value={zip} onChange={(e) => { setZip(e.target.value.replace(/\D/g, "").slice(0, 5)); setZipError(""); }} placeholder={t("zipCode")} inputMode="numeric" className="border-0 bg-mist pl-12 focus:ring-0" />
              {zipError && <span className="absolute left-2 top-14 whitespace-nowrap text-xs text-rose-600">{zipError}</span>}
            </label>
            <Button type="submit" className="h-12 px-7" disabled={availabilityQuery.isFetching && zip === submittedZip}>
              {availabilityQuery.isFetching && zip === submittedZip ? t("checking") : t("checkAvailability")}
            </Button>
          </form>
          {locationChangePending && <p className={`${submitted ? "" : "text-center"} mt-3 text-sm text-black/45`}>{t("locationChanged")}</p>}
        </section>

        {productsQuery.isLoading && <SearchSkeleton />}
        {productsQuery.error && <ErrorPanel message={productsQuery.error.message} />}

        {selectedProduct && selectedVariant && (
          <section className="fade-up grid gap-6 rounded-[2rem] border border-black/[.07] bg-white p-6 shadow-card md:grid-cols-[180px_1fr] md:p-8">
            <div className="flex justify-center"><ProductGlyph product={selectedProduct} large /></div>
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[.14em] text-black/35">{selectedProduct.category}</p><h2 className="mt-1 text-3xl font-semibold tracking-[-.04em]">{selectedProduct.name}</h2><p className="mt-2 text-sm text-black/50">{localizeProductDescription(selectedProduct.id, selectedProduct.description, locale)}</p></div>
                {selectedVariant.price && <p className="rounded-full bg-mist px-4 py-2 text-sm font-semibold">{t("fromPrice", { price: `$${selectedVariant.price.toLocaleString()}` })}</p>}
              </div>
              <div className="mt-7 border-t border-black/[.07] pt-6">
                <VariantPicker variants={selectedProduct.variants} selected={selectedVariant} onChange={(item: ProductVariant) => setSelectedVariantId(item.id)} />
              </div>
            </div>
          </section>
        )}

        {products.length > 1 && <ProductSwitcher products={products} selectedId={selectedProduct?.id ?? ""} onSelect={(item) => { setSelectedProductId(item.id); setSelectedVariantId(item.variants[0]?.id ?? ""); }} />}

        {selectedVariant && !locationChangePending && (
          <section className="mt-12">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div><p className="text-xs font-bold uppercase tracking-[.14em] text-black/35">{t("nearZip", { zip: submittedZip })}</p><h2 className="mt-1 text-3xl font-semibold tracking-[-.04em]">{t("pickupAvailability")}</h2></div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={toggleWatch}
                  className={isWatching ? "bg-orchard hover:bg-[#1b5737]" : ""}
                >
                  {isWatching ? <Pause className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
                  {isWatching ? t("stopWatching") : t("startWatching")}
                </Button>
                <AlertForm variantId={selectedVariant.id} zip={submittedZip} />
              </div>
            </div>

            {isWatching && (
              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2 font-semibold">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  </span>
                  {t("watchingEveryMinute")}
                </span>
                <span className="text-emerald-800/70">
                  {visibleResults.filter((item) => item.availability.available).length > 0
                    ? t("storesAvailableNow", { count: visibleResults.filter((item) => item.availability.available).length })
                    : t("nextCheck", { seconds: secondsUntilCheck })}
                </span>
              </div>
            )}

            {availabilityQuery.data?.is_stale && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t("refreshFailed")}</div>}
            {availabilityQuery.isLoading && <ResultsSkeleton />}
            {availabilityQuery.error && <ErrorPanel message={availabilityQuery.error.message} />}

            {availabilityQuery.data && (
              <>
                {availabilityQuery.data.provider === "demo" && (
                  <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
                    {t("demoInventoryNotice")}
                  </div>
                )}
                <div className="my-6 flex flex-col justify-between gap-3 border-y border-black/[.07] py-4 sm:flex-row sm:items-center">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium"><input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="h-4 w-4 accent-black" />{t("availableOnly")}</label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-black/45">{t("range")}</span>
                      <select
                        value={range}
                        onChange={(event) => setRange(parseDistanceRange(event.target.value))}
                        className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-medium outline-none"
                      >
                        {[25, 50, 100].map((miles) => (
                          <option key={miles} value={miles}>{t("withinMiles", { miles })}</option>
                        ))}
                        <option value="all">{t("anyDistance")}</option>
                      </select>
                    </label>
                    <span className="text-sm text-black/30">· {visibleResults.length === availabilityQuery.data.results.length
                      ? t("storeCount", { count: visibleResults.length })
                      : t("filteredStoreCount", { count: visibleResults.length, total: availabilityQuery.data.results.length })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowDownUp className="h-4 w-4 text-black/35" />
                    <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-medium outline-none"><option value="distance">{t("nearestFirst")}</option><option value="availability">{t("availabilityFirst")}</option></select>
                    <div className="flex rounded-full border border-black/10 bg-white p-1"><button onClick={() => setView("list")} aria-label={t("listView")} className={`rounded-full p-1.5 ${view === "list" ? "bg-ink text-white" : "text-black/40"}`}><List className="h-4 w-4" /></button><button onClick={() => setView("map")} aria-label={t("mapView")} className={`rounded-full p-1.5 ${view === "map" ? "bg-ink text-white" : "text-black/40"}`}><Map className="h-4 w-4" /></button></div>
                  </div>
                </div>
                {visibleResults.length === 0 ? <EmptyResults /> : view === "list" ? <div className="grid gap-3">{visibleResults.map((result, index) => <StoreCard key={result.store.id} result={result} zip={submittedZip} range={range} index={index} />)}</div> : <StoreMap results={visibleResults} />}
                <p className="mt-4 text-center text-xs text-black/35">{availabilityQuery.data.provider === "apple-experimental" ? t("appleData") : availabilityQuery.data.provider === "demo" ? t("locationAwareDemoData") : t("demoData")} · {availabilityQuery.data.is_cached ? t("cachedResult") : t("freshResult")}</p>
              </>
            )}
          </section>
        )}
      </main>
      <footer className="border-t border-black/[.07] px-5 py-8 text-center text-xs text-black/40">{t("footer")}</footer>
    </div>
  );
}

function ProductSwitcher({ products, selectedId, onSelect }: { products: Product[]; selectedId: string; onSelect: (product: Product) => void }) {
  return <div className="mt-5 flex gap-2 overflow-x-auto pb-2">{products.map((product) => <button key={product.id} onClick={() => onSelect(product)} className={`flex shrink-0 items-center gap-3 rounded-2xl border p-3 text-left transition ${selectedId === product.id ? "border-ink bg-white" : "border-black/[.07] bg-white/50"}`}><ProductGlyph product={product} /><span className="pr-3 text-sm font-semibold">{product.name}</span></button>)}</div>;
}

function SearchSkeleton() { return <div className="grid animate-pulse gap-6 rounded-[2rem] bg-white p-8 md:grid-cols-[180px_1fr]"><div className="h-36 rounded-3xl bg-black/[.06]"/><div><div className="h-8 w-64 rounded-lg bg-black/[.07]"/><div className="mt-4 h-4 w-96 max-w-full rounded bg-black/[.05]"/><div className="mt-8 h-16 rounded-2xl bg-black/[.04]"/></div></div>; }
function ResultsSkeleton() { return <div className="mt-7 grid gap-3">{[1,2,3].map((item) => <div key={item} className="h-36 animate-pulse rounded-[1.75rem] bg-white" />)}</div>; }
function ErrorPanel({ message }: { message: string }) {
  const { t } = useI18n();
  return <div role="alert" className="my-7 rounded-3xl border border-rose-200 bg-rose-50 p-6"><p className="font-semibold text-rose-900">{t("loadError")}</p><p className="mt-1 text-sm text-rose-700">{message}</p></div>;
}
function EmptyResults() {
  const { t } = useI18n();
  return <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/50 px-6 py-16 text-center"><Grid2X2 className="mx-auto h-8 w-8 text-black/25"/><p className="mt-4 font-semibold">{t("noStores")}</p><p className="mt-1 text-sm text-black/45">{t("noStoresHelp")}</p></div>;
}
