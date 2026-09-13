import { z } from "zod";

export const zipSchema = z.string().regex(/^\d{5}$/, "Enter a 5-digit ZIP code");
const querySchema = z.string().trim().min(2, "Enter at least 2 characters").max(100);

export function validateSearch(query: string, zip: string): { success: true } | { success: false; error: string } {
  const queryResult = querySchema.safeParse(query);
  if (!queryResult.success) return { success: false, error: queryResult.error.issues[0]?.message ?? "Check the product" };
  const zipResult = zipSchema.safeParse(zip);
  if (!zipResult.success) return { success: false, error: zipResult.error.issues[0]?.message ?? "Check the ZIP code" };
  return { success: true };
}

