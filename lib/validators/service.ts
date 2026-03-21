import { z } from "zod";

const serviceBaseSchema = z.object({
  route: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  price: z.number().min(0, "Price must be positive").optional(),
  category: z.enum(["inside", "outside", "darshan", "tour"]).optional(),
  time: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const serviceSchema = serviceBaseSchema.refine(
  (data) => data.route || (data.from && data.to),
  { message: "Either 'route' or both 'from' and 'to' are required" }
).and(z.object({
  price: z.number().min(0, "Price must be positive"),
  route: z.string().min(1, "Route is required").optional(),
  from: z.string().min(1, "From location is required").optional(),
  to: z.string().min(1, "To location is required").optional(),
}));

export const updateServiceSchema = z.object({
  route: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  price: z.number().min(0, "Price must be positive").optional(),
  category: z.enum(["inside", "outside", "darshan", "tour"]).optional(),
  time: z.string().optional(),
  isActive: z.boolean().optional(),
});
