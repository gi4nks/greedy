import { z } from "zod";

// ============================================================================
// FORM SCHEMAS REGISTRY
// ============================================================================
// Centralized registry for all Zod schemas used in forms and API validation
// This ensures consistency between client-side and server-side validation

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

// Base entity fields that most entities share
export const BaseEntitySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  description: z.string().optional(),
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
  }).optional(),
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
});

// Common status options
export const StatusSchema = z.enum(["planned", "active", "completed", "paused", "cancelled"]).optional().default("active");
export const CampaignStatusSchema = z.enum(["active", "planning", "completed", "hiatus"]).optional().default("active");

// Common priority options
export const PrioritySchema = z.enum(["low", "medium", "high"]).optional().default("medium");

// ============================================================================
// ENTITY-SPECIFIC SCHEMAS
// ============================================================================

// Character Schema
export const CharacterFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  race: z.string().max(50, "Race must be less than 50 characters").optional().or(z.literal("")),
  background: z.string().max(1000, "Background must be less than 1000 characters").optional().or(z.literal("")),
  alignment: z.enum([
    "Lawful Good", "Neutral Good", "Chaotic Good",
    "Lawful Neutral", "True Neutral", "Chaotic Neutral",
    "Lawful Evil", "Neutral Evil", "Chaotic Evil"
  ]),
  description: z.string().max(5000, "Description must be less than 5000 characters").optional().or(z.literal("")),
  characterType: z.enum(["pc", "npc", "monster"]),
  campaignId: z.number().int().positive("Campaign ID is required"),
  adventureId: z.number().int().positive().optional().nullable(),
  // Ability scores
  strength: z.number().int().min(1).max(30),
  dexterity: z.number().int().min(1).max(30),
  constitution: z.number().int().min(1).max(30),
  intelligence: z.number().int().min(1).max(30),
  wisdom: z.number().int().min(1).max(30),
  charisma: z.number().int().min(1).max(30),
  // Combat stats
  hitPoints: z.number().int().min(0),
  maxHitPoints: z.number().int().min(0),
  armorClass: z.number().int().min(0).max(50),
  // Classes as JSON string or array
  classes: z.union([
    z.string(), // JSON string
    z.array(z.object({
      name: z.string().min(1, "Class name is required").max(50, "Class name too long"),
      level: z.number().int().min(1).max(20)
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
  }),
  // Images and tags inherited from BaseEntitySchema
  images: BaseEntitySchema.shape.images,
});

// Location Schema
export const LocationFormSchema = BaseEntitySchema.extend({
  campaignId: z.number().int().positive().optional(),
  adventureId: z.number().int().positive().optional(),
});

// Quest Schema
export const QuestFormSchema = BaseEntitySchema.extend({
  adventureId: z.number().int().positive().optional(),
  status: StatusSchema,
  priority: PrioritySchema,
  type: z.string().optional(),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  campaignId: z.number().int().positive().optional(),
});

// Session Schema
export const SessionFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  date: z.string().min(1, "Date is required"),
  adventureId: z.number().int().positive().optional(),
  text: z.string().optional(),
  campaignId: z.number().int().positive().optional(),
  images: BaseEntitySchema.shape.images,
});

// Magic Item Schema
export const MagicItemFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  rarity: z.string().max(255, "Rarity must be less than 255 characters").optional(),
  type: z.string().max(255, "Type must be less than 255 characters").optional(),
  description: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).optional().nullable(),
  attunementRequired: z.boolean().optional().default(false),
  images: BaseEntitySchema.shape.images,
  tags: BaseEntitySchema.shape.tags,
});

// Adventure Schema
export const AdventureFormSchema = BaseEntitySchema.extend({
  campaignId: z.number().int().positive(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: StatusSchema,
});

// Campaign Schema
export const CampaignFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  description: z.string().optional(),
  status: CampaignStatusSchema,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gameEditionId: z.number().int().positive().optional().default(1),
});

// ============================================================================
// SUB-FORM SCHEMAS
// ============================================================================

// Diary Entry Schema
export const DiaryEntryFormSchema = z.object({
  description: z.string().min(1, "Description is required").max(5000, "Description must be less than 5000 characters"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  linkedEntities: z.array(z.object({
    id: z.string(),
    type: z.string(),
    name: z.string()
  })).default([]),
  isImportant: z.boolean().default(false),
});

// Wiki Entity Schema
export const WikiEntityFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title must be less than 500 characters"),
  contentType: z.enum([
    "spell", "monster", "magic-item", "class", "race", "weapon", "armor",
    "location", "npc", "deity", "organization", "artifact", "other"
  ]),
  wikiUrl: z.string().url("Wiki URL must be a valid URL").optional(),
  rawContent: z.string().optional(),
  parsedData: z.unknown().optional(),
  importedFrom: z.string().optional().default("wiki"),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CharacterFormData = z.infer<typeof CharacterFormSchema>;
export type LocationFormData = z.infer<typeof LocationFormSchema>;
export type QuestFormData = z.infer<typeof QuestFormSchema>;
export type SessionFormData = z.infer<typeof SessionFormSchema>;
export type MagicItemFormData = z.infer<typeof MagicItemFormSchema>;
export type AdventureFormData = z.infer<typeof AdventureFormSchema>;
export type CampaignFormData = z.infer<typeof CampaignFormSchema>;
export type DiaryEntryFormData = z.infer<typeof DiaryEntryFormSchema>;
export type WikiEntityFormData = z.infer<typeof WikiEntityFormSchema>;

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================
// Re-export existing schemas for backward compatibility
export { characterSchema as LegacyCharacterSchema } from "../validation/character";
export { diaryEntrySchema as LegacyDiaryEntrySchema } from "../validation/character";