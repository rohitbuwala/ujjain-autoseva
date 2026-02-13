import { z } from "zod";

export const feedbackSchema = z.object({
    name: z.string().min(2, "Name is required"),
    rating: z.number().min(1).max(5),
    comment: z.string().min(5, "Comment must be at least 5 characters"),
});
