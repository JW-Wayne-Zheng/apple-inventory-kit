"use client";

import { Languages } from "lucide-react";
import { useI18n, type Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-black/10 bg-white p-1 shadow-sm"
      aria-label={t("language")}
    >
      <Languages className="ml-1.5 h-3.5 w-3.5 text-black/40" />
      {(["en", "zh"] as Locale[]).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          aria-pressed={locale === item}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
            locale === item ? "bg-ink text-white" : "text-black/45 hover:text-black"
          }`}
        >
          {item === "en" ? "EN" : "中文"}
        </button>
      ))}
    </div>
  );
}
