import { z } from "zod";

export const templeSchema = z.object({
  name: z.string().min(1, "Temple name is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  description: z.string().optional().default(""),
  isActive: z.boolean().optional().default(true),
});

export const templeUpdateSchema = templeSchema.partial();

export type TempleInput = z.infer<typeof templeSchema>;
export type TempleUpdateInput = z.infer<typeof templeUpdateSchema>;
