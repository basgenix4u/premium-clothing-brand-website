import { z } from "zod";
import { MAX_LINE_QUANTITY } from "@/server/modules/cart/policy";

export const addItemSchema = z
  .object({
    variantId: z.string().trim().min(1).max(40),
    size: z.string().trim().min(1).max(10),
    quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY).default(1),
  })
  .strict();

export const updateItemSchema = z
  .object({
    quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
  })
  .strict();

export const applyPromoSchema = z
  .object({
    code: z.string().trim().min(1).max(40),
  })
  .strict();

export const shippingSchema = z
  .object({
    shippingMethodId: z.string().trim().min(1).max(60),
  })
  .strict();

export const uuidSchema = z.uuid();
