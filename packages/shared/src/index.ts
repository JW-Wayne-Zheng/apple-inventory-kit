import { z } from "zod";

export const availabilityStatusSchema = z.enum([
  "AVAILABLE",
  "LIMITED",
  "UNAVAILABLE",
  "UNKNOWN",
]);

export type AvailabilityStatus = z.infer<typeof availabilityStatusSchema>;

export const searchParamsSchema = z.object({
  product: z.string().optional(),
  variant: z.string().optional(),
  zip: z.string().regex(/^\d{5}$/).optional(),
});

