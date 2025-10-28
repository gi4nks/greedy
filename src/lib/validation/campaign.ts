import { z } from "zod";

// Campaign validation schema
export const campaignSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),

  description: z.string()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .or(z.literal("")),

  gameEditionId: z.number().int().positive().optional().nullable(),

  status: z.enum(["active", "completed", "paused", "cancelled"])
    .default("active"),

  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),

  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),

  // Tags as JSON string or array
  tags: z.union([
    z.string(),
    z.array(z.string())
  ]).transform((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }).optional()
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
export type CampaignFormData = z.infer<typeof campaignSchema>;