import { z } from "zod";

// Location validation schema
export const locationSchema = z.object({
  name: z.string()
    .min(1, "Location name is required")
    .max(200, "Location name must be less than 200 characters"),

  description: z.string()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .or(z.literal("")),

  // Tags as comma-separated string or array
  tags: z.union([
    z.string(),
    z.array(z.string())
  ]).transform((val) => {
    if (typeof val === "string") {
      return val.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    return val;
  }).default([]),

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

  campaignId: z.number().int().positive("Campaign ID is required"),

  adventureId: z.number().int().positive().optional().nullable()
});

// Type inference
export type LocationFormData = z.infer<typeof locationSchema>;