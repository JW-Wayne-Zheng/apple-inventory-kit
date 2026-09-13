"use client";

import type { ProductVariant } from "@/lib/types";
import { localizeAttributeValue, useI18n } from "@/lib/i18n";

export function VariantPicker({
  variants,
  selected,
  onChange,
}: {
  variants: ProductVariant[];
  selected: ProductVariant;
  onChange: (variant: ProductVariant) => void;
}) {
  const { locale, t } = useI18n();
  const keys = Array.from(new Set(variants.flatMap((variant) => Object.keys(variant.attributes))));

  function choose(key: string, value: string) {
    const exact = variants.find(
      (variant) =>
        variant.attributes[key] === value &&
        keys.every((other) => other === key || variant.attributes[other] === selected.attributes[other]),
    );
    onChange(exact ?? variants.find((variant) => variant.attributes[key] === value) ?? selected);
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {keys.map((key) => {
        const values = Array.from(new Set(variants.map((variant) => variant.attributes[key]).filter(Boolean)));
        return (
          <fieldset key={key}>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-black/45">{key.toLowerCase() === "color" ? t("color") : key.toLowerCase() === "storage" ? t("storage") : key}</legend>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                const active = selected.attributes[key] === value;
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => choose(key, value)}
                    aria-pressed={active}
                    className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                      active
                        ? "border-ink bg-ink text-white"
                        : "border-black/10 bg-white text-black/70 hover:border-black/30"
                    }`}
                  >
                    {localizeAttributeValue(value, locale)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
