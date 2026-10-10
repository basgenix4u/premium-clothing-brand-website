import { z } from "zod";

export const SORT_KEYS = ["featured", "newest", "price-asc", "price-desc", "popularity"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

const optionalText = (max: number) => z.string().trim().min(1).max(max).optional();

export const productQuerySchema = z.object({
  category: optionalText(60),
  audience: z.enum(["women", "men", "unisex"]).optional(),
  style: optionalText(30),
  size: optionalText(10),
  colour: optionalText(30),
  minPrice: z.coerce.number().nonnegative().max(1_000_000).optional(),
  maxPrice: z.coerce.number().nonnegative().max(1_000_000).optional(),
  q: optionalText(80),
  sort: z.enum(SORT_KEYS).default("featured"),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  cursor: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,40}$/, "Invalid cursor.")
    .optional(),
});

export type ProductQuery = z.output<typeof productQuerySchema>;

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(120);
