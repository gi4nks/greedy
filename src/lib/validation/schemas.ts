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
  wikiUrl: z.string().refine(
    (url) => !url || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"),
    "Wiki URL must be a valid URL or a relative path"
  ).optional().or(z.literal("")),
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

// Diary schemas
export const DiaryEntrySchema = z.object({
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  linkedEntities: z.array(z.object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
  })).optional().default([]),
  isImportant: z.boolean().optional().default(false),
});

// Relationship schemas (for NPC-Character relationships)
export const RelationshipFormSchema = z.object({
  npcId: z.string().min(1, "NPC is required"),
  characterId: z.string().min(1, "Character is required"),
  relationshipType: z.enum(["ally", "enemy", "neutral", "romantic", "family", "friend", "rival"]),
  strength: z.number().int().min(-100).max(100),
  trust: z.number().int().min(0).max(100),
  fear: z.number().int().min(0).max(100),
  respect: z.number().int().min(0).max(100),
  description: z.string().optional(),
  isMutual: z.boolean().optional().default(true),
  discoveredByPlayers: z.boolean().optional().default(false),
});

// Relation schemas
export const RelationSchema = z.object({
  campaignId: z.number().int().positive("Campaign ID must be a positive integer"),
  sourceEntityType: z.enum(["character", "npc", "location", "quest", "adventure", "session"]),
  sourceEntityId: z.number().int().positive("Source entity ID must be a positive integer"),
  targetEntityType: z.enum(["character", "npc", "location", "quest", "adventure", "session"]),
  targetEntityId: z.number().int().positive("Target entity ID must be a positive integer"),
  relationType: z.string().min(1, "Relation type is required"),
  description: z.string().optional(),
  bidirectional: z.boolean().optional().default(false),
  metadata: z.any().optional(),
});

// Wiki schemas
export const WikiMonsterSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title must be less than 500 characters"),
  contentType: z.literal("monster"),
  wikiUrl: z.string().url("Wiki URL must be a valid URL").optional(),
  rawContent: z.string().optional(),
  parsedData: z.unknown().optional(),
  importedFrom: z.string().optional().default("wiki"),
});

export const WikiSpellSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title must be less than 500 characters"),
  contentType: z.literal("spell"),
  wikiUrl: z.string().url("Wiki URL must be a valid URL").optional(),
  rawContent: z.string().optional(),
  parsedData: z.unknown().optional(),
  importedFrom: z.string().optional().default("wiki"),
});

// Image upload schemas
export const ImageUploadSchema = z.object({
  entityType: z.enum(["character", "location", "quest", "adventure", "session", "campaign"]),
  entityId: z.number().int().positive("Entity ID must be a positive integer"),
  // File validation will be handled separately in the upload function
});

// Export schemas
export const ExportOptionsSchema = z.object({
  campaignId: z.number().int().positive("Campaign ID must be a positive integer"),
  format: z.enum(["markdown", "pdf", "html", "json"]),
  sections: z.object({
    sessions: z.boolean().optional(),
    characters: z.boolean().optional(),
    locations: z.boolean().optional(),
    quests: z.boolean().optional(),
    magicItems: z.boolean().optional(),
  }),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
});

// Helper function to create unified error response
export function createValidationError(message: string, details?: unknown) {
  return {
    success: false,
    error: message,
    data: details,
  };
}

// Helper function to validate request body and return unified response
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown,
):
  | { success: true; data: T }
  | { success: false; error: string; data?: unknown } {
  const result = schema.safeParse(body);

  if (!result.success) {
    const errorMessages = result.error.issues.map(
      (err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`,
    );
    return {
      success: false,
      error: "Invalid request data",
      data: errorMessages,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
