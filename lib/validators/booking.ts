import { z } from "zod";

export const bookingSchema = z.object({

  name: z
    .string()
    .min(3, "Name minimum 3 letters")
    .regex(/^[A-Za-z ]+$/, "Only letters allowed"),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter valid 10 digit number"),

  altPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid alternate number")
    .optional()
    .or(z.literal("")),

  pickup: z
    .string()
    .min(3, "Pickup location required"),

  drop: z
    .string()
    .min(3, "Drop location required"),

  date: z
    .string()
    .min(1, "Select date"),

  time: z
    .string()
    .min(1, "Select time"),

  price: z
    .string()
    .regex(/^\d+$/, "Only numbers allowed"),
});
