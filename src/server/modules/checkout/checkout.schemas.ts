import { z } from "zod";
import { emailSchema } from "@/server/modules/auth/schemas";

export const shippingAddressSchema = z
  .object({
    fullName: z.string().trim().min(1, "Enter a full name.").max(120),
    line1: z.string().trim().min(1, "Enter an address.").max(160),
    line2: z.string().trim().max(160).optional(),
    city: z.string().trim().min(1, "Enter a city.").max(100),
    region: z.string().trim().max(100).optional(),
    postalCode: z.string().trim().max(20).optional(),
    country: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "Use a two-letter country code."),
    phone: z.string().trim().max(30).optional(),
  })
  .strict();

export const checkoutSchema = z
  .object({
    email: emailSchema,
    shippingAddress: shippingAddressSchema,
  })
  .strict();

export type CheckoutRequest = z.infer<typeof checkoutSchema>;

export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,80}$/;
