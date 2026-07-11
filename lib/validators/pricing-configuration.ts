import { z } from "zod";

export const PRICING_SLOT_KEYS = [
  "pricing-primary",
  "pricing-secondary",
  "pricing-custom",
] as const;

export type PricingSlotKey = (typeof PRICING_SLOT_KEYS)[number];

const pricingSlotSchema = z.object({
  key: z.string().min(1, "Slot key is required"),
  route: z.string().min(1, "Route ID is required"),
  enabled: z.boolean().default(true),
});

export const pricingConfigurationSchema = z
  .object({
    slots: z.array(pricingSlotSchema),
  })
  .refine(
    (data) => {
      const keys = data.slots.map((s) => s.key);
      return keys.length === new Set(keys).size;
    },
    { message: "Duplicate slot keys are not allowed" }
  )
  .refine(
    (data) => {
      const routeIds = data.slots.map((s) => s.route);
      return routeIds.length === new Set(routeIds).size;
    },
    { message: "Duplicate routes are not allowed across slots" }
  );

export type PricingConfigurationInput = z.infer<
  typeof pricingConfigurationSchema
>;
export type PricingSlotInput = z.infer<typeof pricingSlotSchema>;
