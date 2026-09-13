"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, Check, LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type Fields = z.infer<typeof schema>;

export function AlertForm({ variantId, zip }: { variantId: string; zip: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [complete, setComplete] = useState(false);
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState } = useForm<Fields>({ resolver: zodResolver(schema) });

  async function submit(fields: Fields) {
    setServerError("");
    try {
      await api.createAlert({ contact: fields.email, product_variant_id: variantId, postal_code: zip });
      setComplete(true);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t("alertFailed"));
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Bell className="h-4 w-4" /> {t("alertButton")}
      </Button>
    );
  }

  return (
    <div className="relative rounded-3xl border border-black/10 bg-white p-5 shadow-card">
      <button
        className="absolute right-4 top-4 rounded-full p-1.5 text-black/40 hover:bg-black/5"
        onClick={() => setOpen(false)}
        aria-label={t("closeAlert")}
      >
        <X className="h-4 w-4" />
      </button>
      {complete ? (
        <div className="flex items-center gap-3 pr-8">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-5 w-5" /></span>
          <div><p className="font-semibold">{t("alertCreated")}</p><p className="text-sm text-black/50">{t("alertCreatedBody")}</p></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="pr-7">
          <p className="font-semibold">{t("alertTitle")}</p>
          <p className="mt-1 text-sm text-black/50">{t("alertBody")}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <Input placeholder="you@example.com" type="email" {...register("email")} />
              {formState.errors.email && <p className="mt-1.5 text-xs text-rose-600">{t("invalidEmail")}</p>}
            </div>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />} {t("saveAlert")}
            </Button>
          </div>
          {serverError && <p className="mt-2 text-xs text-rose-600">{serverError}</p>}
        </form>
      )}
    </div>
  );
}
