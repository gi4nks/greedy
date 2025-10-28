import { z } from "zod";

// Session validation schema
export const sessionSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),

  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),

  text: z.string()
    .max(50000, "Session text must be less than 50,000 characters")
    .optional()
    .or(z.literal("")),

  adventureId: z.union([
    z.string().transform((val) => val === "none" ? null : parseInt(val)),
    z.number().int().positive().nullable(),
    z.literal("")
  ]).transform((val) => {
    if (val === "" || val === null) return null;
    return val;
  }).optional(),

  // Images as JSON string
  images: z.union([
    z.string(),
    z.array(z.object({
      id: z.string(),
      filename: z.string(),
      url: z.string(),
      alt: z.string().optional()
    }))
  ]).transform((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }).optional(),

  campaignId: z.number().int().positive().optional()
});

// Type inference
export type SessionFormData = z.infer<typeof sessionSchema>;