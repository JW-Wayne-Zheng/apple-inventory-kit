"use client";

import {
  ArrowUpRight,
  Check,
  Copy,
  MapPin,
  Navigation,
  ShieldCheck,
  ShoppingBag,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { getAppleBuyUrl, getAppleProductName } from "@/lib/apple";
import {
  localizeAttributeValue,
  localizePickupMessage,
  useI18n,
} from "@/lib/i18n";
import type { AvailabilityResult } from "@/lib/types";
import { Button } from "./ui/button";

export function CheckoutHandoff({
  result,
  zip,
}: {
  result: AvailabilityResult;
  zip: string;
}) {
  const { locale, t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const productName = getAppleProductName(result.product);
  const appleUrl = getAppleBuyUrl(result.product);
  const storage = result.product.attributes.Storage ?? "—";
  const color = localizeAttributeValue(
    result.product.attributes.Color ?? "—",
    locale,
  );
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${result.store.name}, ${result.store.address}, ${result.store.city}, ${result.store.region} ${result.store.postal_code}`,
  )}`;

  async function copyOrderDetails() {
    const details = [
      productName,
      `${t("storage")}: ${storage}`,
      `${t("color")}: ${color}`,
      `${t("pickupStore")}: ${result.store.name}`,
      `${result.store.address}, ${result.store.city}, ${result.store.region} ${result.store.postal_code}`,
      `${t("zipCode")}: ${zip}`,
      appleUrl,
    ].join("\n");
    await navigator.clipboard.writeText(details);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  }

  return (
    <>
      <Button
        type="button"
        className="h-10 px-4"
        onClick={() => dialogRef.current?.showModal()}
      >
        <ShoppingBag className="h-4 w-4" />
        {t("orderAtApple")}
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`checkout-title-${result.store.id}`}
        className="w-[calc(100%-2rem)] max-w-xl rounded-[2rem] border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-black/45"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-orchard">
                {t("officialCheckout")}
              </p>
              <h2
                id={`checkout-title-${result.store.id}`}
                className="mt-2 text-3xl font-semibold tracking-[-.04em]"
              >
                {t("readyToOrder")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-black/50">
                {t("checkoutHandoffBody")}
              </p>
            </div>
            <form method="dialog">
              <button
                aria-label={t("closeCheckout")}
                className="rounded-full p-2 text-black/40 transition hover:bg-mist hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </form>
          </div>

          <div className="mt-6 grid gap-3 rounded-3xl bg-mist p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-black/35">
                {t("selectedConfiguration")}
              </p>
              <p className="mt-2 text-lg font-semibold">{productName}</p>
              <p className="mt-1 text-sm text-black/55">
                {storage} · {color} · {t("unlocked")}
              </p>
              {result.product.price && (
                <p className="mt-2 text-sm font-semibold">
                  {t("fromPrice", {
                    price: `$${result.product.price.toLocaleString()}`,
                  })}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-black/35">
                {t("pickupStore")}
              </p>
              <p className="mt-2 flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4 text-orchard" />
                {result.store.name}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-black/50">
                {result.store.address}, {result.store.city}, {result.store.region}{" "}
                {result.store.postal_code}
              </p>
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                {localizePickupMessage(
                  result.availability.pickup_message,
                  locale,
                )}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold">{t("finishAtApple")}</p>
            <ol className="mt-3 grid gap-2 text-sm text-black/55">
              {[t("checkoutStepOne"), t("checkoutStepTwo"), t("checkoutStepThree")].map(
                (step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ),
              )}
            </ol>
          </div>

          <div className="mt-7 grid gap-2 sm:grid-cols-2">
            <a
              href={appleUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-black/75"
            >
              <ShoppingBag className="h-4 w-4" />
              {t("openExactConfiguration")}
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <Button type="button" variant="secondary" className="h-12" onClick={copyOrderDetails}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t("copied") : t("copyOrderDetails")}
            </Button>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-black/60 transition hover:bg-mist hover:text-black sm:col-span-2"
            >
              <Navigation className="h-4 w-4" />
              {t("directionsToStore")}
            </a>
          </div>

          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-black/40">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            {t("checkoutPrivacy")}
          </p>
        </div>
      </dialog>
    </>
  );
}
