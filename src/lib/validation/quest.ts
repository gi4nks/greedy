import { z } from "zod";

// Quest validation schema
export const questSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),

  description: z.string()
    .max(5000, "Description must be less than 5000 characters")
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

  status: z.enum(["active", "completed", "failed", "paused"])
    .default("active"),

  priority: z.enum(["high", "medium", "low"])
    .default("medium"),

  type: z.enum(["main", "side", "personal"])
    .default("main"),

  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),

  assignedTo: z.string()
    .max(100, "Assigned to must be less than 100 characters")
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

  campaignId: z.number().int().positive("Campaign ID is required")
});

// Type inference
export type QuestFormData = z.infer<typeof questSchema>;