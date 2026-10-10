import { z } from "zod";

/** Shape of `looks.items`. Validated on read because the column is free-form JSON. */
export const lookItemsSchema = z.array(
  z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    label: z.string().min(1).max(40),
  }),
);

export const articleSlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(120);
