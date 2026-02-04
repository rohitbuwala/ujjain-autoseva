import { z } from "zod";

/* ✅ Register */
export const registerSchema = z.object({
  name: z.string().min(2, "Name too short"),

  email: z.string().email("Invalid email"),

  password: z.string().min(6, "Min 6 characters"),
});


/* ✅ Login */
export const loginSchema = z.object({
  email: z.string().email(),

  password: z.string().min(6),
});


/* ✅ Forgot Password */
export const forgotSchema = z.object({
  email: z.string().email(),
});


/* ✅ Reset Password */
export const resetSchema = z.object({
  token: z.string(),

  password: z.string().min(6),
});
