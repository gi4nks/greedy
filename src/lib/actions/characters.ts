import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionResult } from "@/lib/types/api";

const CreateCharacterSchema = z.object({
  campaignId: z.number(),
  adventureId: z.number().optional().nullable(),
  characterType: z.enum(["pc", "npc", "monster"]).default("pc"),
  name: z.string().min(1, "Name is required"),
  race: z.string().nullable().optional(),
  background: z.string().nullable().optional(),
  alignment: z.string().nullable().optional(),
  strength: z.number().min(1).max(30).default(10),
  dexterity: z.number().min(1).max(30).default(10),
  constitution: z.number().min(1).max(30).default(10),
  intelligence: z.number().min(1).max(30).default(10),
  wisdom: z.number().min(1).max(30).default(10),
  charisma: z.number().min(1).max(30).default(10),
  hitPoints: z.number().min(0).default(0),
  maxHitPoints: z.number().min(0).default(0),
  armorClass: z.number().min(0).default(10),
  classes: z
    .array(z.object({ name: z.string(), level: z.number() }))
    .default([]),
  description: z.string().nullable().optional(),
  images: z
    .array(
      z.object({
        filename: z.string().optional(),
        url: z.string(),
        uploadedAt: z.string().optional(),
      }),
    )
    .default([]),
}).passthrough(); // Allow additional fields to be passed through

export async function createCharacter(
  prevState: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const validatedFields = CreateCharacterSchema.safeParse({
    campaignId: Number(formData.get("campaignId")),
    adventureId: formData.get("adventureId")
      ? Number(formData.get("adventureId"))
      : undefined,
    characterType: formData.get("characterType") || "pc",
    name: formData.get("name"),
    race: formData.get("race"),
    background: formData.get("background"),
    alignment: formData.get("alignment"),
    strength: formData.get("strength") ? Number(formData.get("strength")) : 10,
    dexterity: formData.get("dexterity")
      ? Number(formData.get("dexterity"))
      : 10,
    constitution: formData.get("constitution")
      ? Number(formData.get("constitution"))
      : 10,
    intelligence: formData.get("intelligence")
      ? Number(formData.get("intelligence"))
      : 10,
    wisdom: formData.get("wisdom") ? Number(formData.get("wisdom")) : 10,
    charisma: formData.get("charisma") ? Number(formData.get("charisma")) : 10,
    hitPoints: formData.get("hitPoints")
      ? Number(formData.get("hitPoints"))
      : 0,
    maxHitPoints: formData.get("maxHitPoints")
      ? Number(formData.get("maxHitPoints"))
      : 0,
    armorClass: formData.get("armorClass")
      ? Number(formData.get("armorClass"))
      : 10,
    classes: formData.get("classes")
      ? JSON.parse(formData.get("classes") as string)
      : [],
    description: formData.get("description"),
    images: formData.get("images")
      ? JSON.parse(formData.get("images") as string)
      : [],
  });

  if (!validatedFields.success) {
    console.error("Character validation errors:", validatedFields.error.issues);
    const errorMessages = validatedFields.error.issues
      .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
      .join(", ");
    return {
      success: false,
      error: `Validation failed: ${errorMessages}`,
    };
  }

  const characterData = validatedFields.data;

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db.insert(characters).values({
      ...characterData,
      classes: JSON.stringify(characterData.classes),
      images: JSON.stringify(characterData.images),
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath(`/campaigns/${characterData.campaignId}/characters`);
    return {
      success: true,
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      error: "Database Error: Failed to create character.",
    };
  }
}

export async function updateCharacter(
  id: number,
  prevState: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const validatedFields = CreateCharacterSchema.safeParse({
    campaignId: Number(formData.get("campaignId")),
    adventureId: formData.get("adventureId")
      ? Number(formData.get("adventureId"))
      : undefined,
    characterType: formData.get("characterType") || "pc",
    name: formData.get("name"),
    race: formData.get("race"),
    background: formData.get("background"),
    alignment: formData.get("alignment"),
    strength: formData.get("strength") ? Number(formData.get("strength")) : 10,
    dexterity: formData.get("dexterity")
      ? Number(formData.get("dexterity"))
      : 10,
    constitution: formData.get("constitution")
      ? Number(formData.get("constitution"))
      : 10,
    intelligence: formData.get("intelligence")
      ? Number(formData.get("intelligence"))
      : 10,
    wisdom: formData.get("wisdom") ? Number(formData.get("wisdom")) : 10,
    charisma: formData.get("charisma") ? Number(formData.get("charisma")) : 10,
    hitPoints: formData.get("hitPoints")
      ? Number(formData.get("hitPoints"))
      : 0,
    maxHitPoints: formData.get("maxHitPoints")
      ? Number(formData.get("maxHitPoints"))
      : 0,
    armorClass: formData.get("armorClass")
      ? Number(formData.get("armorClass"))
      : 10,
    classes: formData.get("classes")
      ? JSON.parse(formData.get("classes") as string)
      : [],
    description: formData.get("description"),
    images: formData.get("images")
      ? JSON.parse(formData.get("images") as string)
      : [],
  });

  if (!validatedFields.success) {
    console.error("Character validation errors:", validatedFields.error.issues);
    const errorMessages = validatedFields.error.issues
      .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
      .join(", ");
    return {
      success: false,
      error: `Validation failed: ${errorMessages}`,
    };
  }

  const characterData = validatedFields.data;

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db
      .update(characters)
      .set({
        ...characterData,
        classes: JSON.stringify(characterData.classes),
        images: JSON.stringify(characterData.images),
        updatedAt: now,
      })
      .where(eq(characters.id, id));

    revalidatePath(`/campaigns/${characterData.campaignId}/characters`);
    return { success: true };
  } catch (error) {
    console.error("Database error updating character:", error);
    return {
      success: false,
      error: "Database Error: Failed to update character.",
    };
  }
}

export async function deleteCharacter(id: number): Promise<ActionResult> {
  try {
    const character = await db
      .select({ campaignId: characters.campaignId })
      .from(characters)
      .where(eq(characters.id, id))
      .limit(1);

    if (character.length > 0) {
      await db.delete(characters).where(eq(characters.id, id));
      revalidatePath(`/campaigns/${character[0].campaignId}/characters`);
      return { success: true };
    } else {
      return {
        success: false,
        message: "Character not found.",
      };
    }
  } catch (error) {
    console.error("Database error deleting character:", error);
    return {
      success: false,
      message: "Database Error: Failed to delete character.",
    };
  }
}

export async function deleteCharacterAction(
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const id = Number(formData.get("id"));
  return await deleteCharacter(id);
}
