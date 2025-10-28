import { z } from "zod";

// Adventure validation schema
export const adventureSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),

  description: z.string()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .or(z.literal("")),

  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),

  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),

  status: z.enum(["planned", "active", "completed", "paused", "cancelled"])
    .default("planned"),

  slug: z.string()
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9-]*$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .optional()
    .or(z.literal("")),

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

  campaignId: z.number().int().positive("Campaign ID is required")
}).refine((data) => {
  // If both dates are provided, end date should be after start date
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

// Type inference
export type AdventureFormData = z.infer<typeof adventureSchema>;