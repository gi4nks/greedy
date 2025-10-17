import { z } from "zod";

// Common validation schemas for API routes

// Campaign schemas
export const CreateCampaignSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z.string().optional(),
  status: z
    .enum(["active", "completed", "paused", "cancelled"])
    .optional()
    .default("active"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gameEditionId: z.number().int().positive().optional().default(1),
});

export const UpdateCampaignSchema = CreateCampaignSchema.partial();

// Magic Item schemas
export const CreateMagicItemSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  rarity: z
    .string()
    .max(255, "Rarity must be less than 255 characters")
    .optional(),
  type: z.string().max(255, "Type must be less than 255 characters").optional(),
  description: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).optional().nullable(),
  attunementRequired: z.boolean().optional().default(false),
  images: z.array(z.unknown()).optional(),
});

// Wiki Article schemas
export const CreateWikiArticleSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(500, "Title must be less than 500 characters"),
  contentType: z.enum([
    "spell",
    "monster",
    "magic-item",
    "class",
    "race",
    "weapon",
    "armor",
    "location",
    "npc",
    "deity",
    "organization",
    "artifact",
    "other",
  ]),
  wikiUrl: z.string().url("Wiki URL must be a valid URL").optional(),
  rawContent: z.string().optional(),
  parsedData: z.unknown().optional(),
  importedFrom: z.string().optional().default("wiki"),
});

export const UpdateMagicItemSchema = CreateMagicItemSchema.partial();

// Session schemas
export const CreateSessionSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  date: z.string().min(1, "Date is required"),
  adventureId: z.number().int().positive().optional(),
  text: z.string().optional(),
  images: z.array(z.unknown()).optional(),
  campaignId: z.number().int().positive().optional(),
});

export const UpdateSessionSchema = CreateSessionSchema.partial();

// Character schemas (for API routes if any)
export const CreateCharacterSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  race: z.string().optional(),
  characterType: z.enum(["pc", "npc"]).optional().default("pc"),
  campaignId: z.number().int().positive().optional(),
  adventureId: z.number().int().positive().optional(),
  // Add other character fields as needed
});

export const UpdateCharacterSchema = CreateCharacterSchema.partial();

// Location schemas (for API routes if any)
export const CreateLocationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  description: z.string().optional(),
  campaignId: z.number().int().positive().optional(),
  adventureId: z.number().int().positive().optional(),
  // Add other location fields as needed
});

export const UpdateLocationSchema = CreateLocationSchema.partial();

// Quest schemas (for API routes if any)
export const CreateQuestSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z.string().optional(),
  adventureId: z.number().int().positive().optional(),
  status: z
    .enum(["active", "completed", "cancelled"])
    .optional()
    .default("active"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  type: z.string().optional(),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  campaignId: z.number().int().positive().optional(),
  // Add other quest fields as needed
});

export const UpdateQuestSchema = CreateQuestSchema.partial();

// Helper function to create APIError response
export function createAPIError(
  code: string,
  message: string,
  details?: unknown,
) {
  return {
    error: {
      code,
      message,
      details,
    },
  };
}

// Helper function to validate request body and return appropriate response
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown,
):
  | { success: true; data: T }
  | { success: false; error: ReturnType<typeof createAPIError> } {
  const result = schema.safeParse(body);

  if (!result.success) {
    const errorMessages = result.error.issues.map(
      (err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`,
    );
    return {
      success: false,
      error: createAPIError(
        "VALIDATION_ERROR",
        "Invalid request data",
        errorMessages,
      ),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
