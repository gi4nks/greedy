'use server';

import { db } from '@/lib/db';
import { characters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const CreateCharacterSchema = z.object({
  campaignId: z.number(),
  adventureId: z.number().optional(),
  characterType: z.enum(['pc', 'npc', 'monster']).default('pc'),
  name: z.string().min(1, 'Name is required'),
  race: z.string().nullable().optional(),
  level: z.number().min(1).max(20).optional(),
  background: z.string().nullable().optional(),
  alignment: z.string().nullable().optional(),
  experience: z.number().min(0).default(0),
  strength: z.number().min(1).max(30).default(10),
  dexterity: z.number().min(1).max(30).default(10),
  constitution: z.number().min(1).max(30).default(10),
  intelligence: z.number().min(1).max(30).default(10),
  wisdom: z.number().min(1).max(30).default(10),
  charisma: z.number().min(1).max(30).default(10),
  hitPoints: z.number().min(0).default(0),
  maxHitPoints: z.number().min(0).default(0),
  armorClass: z.number().min(0).default(10),
  initiative: z.number().default(0),
  speed: z.number().min(0).default(30),
  proficiencyBonus: z.number().min(0).max(10).default(2),
  savingThrows: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  weapons: z.array(z.string()).default([]),
  spells: z.array(z.string()).default([]),
  spellcastingAbility: z.string().nullable().optional(),
  spellSaveDc: z.number().nullable().optional(),
  spellAttackBonus: z.number().nullable().optional(),
  personalityTraits: z.string().nullable().optional(),
  ideals: z.string().nullable().optional(),
  bonds: z.string().nullable().optional(),
  flaws: z.string().nullable().optional(),
  backstory: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  npcRelationships: z.array(z.object({ name: z.string(), type: z.string(), description: z.string() })).default([]),
  classes: z.array(z.object({ name: z.string(), level: z.number() })).default([]),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
});

export async function createCharacter(formData: FormData) {
  const validatedFields = CreateCharacterSchema.safeParse({
    campaignId: Number(formData.get('campaignId')),
    adventureId: formData.get('adventureId') ? Number(formData.get('adventureId')) : undefined,
    characterType: formData.get('characterType') || 'pc',
    name: formData.get('name'),
    race: formData.get('race'),
    background: formData.get('background'),
    alignment: formData.get('alignment'),
    experience: formData.get('experience') ? Number(formData.get('experience')) : 0,
    strength: formData.get('strength') ? Number(formData.get('strength')) : 10,
    dexterity: formData.get('dexterity') ? Number(formData.get('dexterity')) : 10,
    constitution: formData.get('constitution') ? Number(formData.get('constitution')) : 10,
    intelligence: formData.get('intelligence') ? Number(formData.get('intelligence')) : 10,
    wisdom: formData.get('wisdom') ? Number(formData.get('wisdom')) : 10,
    charisma: formData.get('charisma') ? Number(formData.get('charisma')) : 10,
    hitPoints: formData.get('hitPoints') ? Number(formData.get('hitPoints')) : 0,
    maxHitPoints: formData.get('maxHitPoints') ? Number(formData.get('maxHitPoints')) : 0,
    armorClass: formData.get('armorClass') ? Number(formData.get('armorClass')) : 10,
    initiative: formData.get('initiative') ? Number(formData.get('initiative')) : 0,
    speed: formData.get('speed') ? Number(formData.get('speed')) : 30,
    proficiencyBonus: formData.get('proficiencyBonus') ? Number(formData.get('proficiencyBonus')) : 2,
    savingThrows: formData.get('savingThrows') ? JSON.parse(formData.get('savingThrows') as string) : [],
    skills: formData.get('skills') ? JSON.parse(formData.get('skills') as string) : [],
    equipment: formData.get('equipment') ? JSON.parse(formData.get('equipment') as string) : [],
    weapons: formData.get('weapons') ? JSON.parse(formData.get('weapons') as string) : [],
    spells: formData.get('spells') ? JSON.parse(formData.get('spells') as string) : [],
    spellcastingAbility: formData.get('spellcastingAbility'),
    spellSaveDc: formData.get('spellSaveDc') ? Number(formData.get('spellSaveDc')) : undefined,
    spellAttackBonus: formData.get('spellAttackBonus') ? Number(formData.get('spellAttackBonus')) : undefined,
    personalityTraits: formData.get('personalityTraits'),
    ideals: formData.get('ideals'),
    bonds: formData.get('bonds'),
    flaws: formData.get('flaws'),
    backstory: formData.get('backstory'),
    role: formData.get('role'),
    npcRelationships: formData.get('npcRelationships') ? JSON.parse(formData.get('npcRelationships') as string) : [],
    classes: formData.get('classes') ? JSON.parse(formData.get('classes') as string) : [],
    description: formData.get('description'),
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
    images: formData.get('images') ? JSON.parse(formData.get('images') as string) : [],
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const characterData = validatedFields.data;

  try {
    const [character] = await db.insert(characters).values({
      ...characterData,
      savingThrows: JSON.stringify(characterData.savingThrows),
      skills: JSON.stringify(characterData.skills),
      equipment: JSON.stringify(characterData.equipment),
      weapons: JSON.stringify(characterData.weapons),
      spells: JSON.stringify(characterData.spells),
      npcRelationships: JSON.stringify(characterData.npcRelationships),
      classes: JSON.stringify(characterData.classes),
      tags: JSON.stringify(characterData.tags),
      images: JSON.stringify(characterData.images),
    }).returning();

    revalidatePath(`/campaigns/${characterData.campaignId}/characters`);
    redirect(`/campaigns/${characterData.campaignId}/characters`);
  } catch (error) {
    console.error('Database error:', error);
    return {
      message: 'Database Error: Failed to create character.',
    };
  }
}

export async function updateCharacter(id: number, formData: FormData) {
  const validatedFields = CreateCharacterSchema.safeParse({
    campaignId: Number(formData.get('campaignId')),
    adventureId: formData.get('adventureId') ? Number(formData.get('adventureId')) : undefined,
    characterType: formData.get('characterType') || 'pc',
    name: formData.get('name'),
    race: formData.get('race'),
    background: formData.get('background'),
    alignment: formData.get('alignment'),
    experience: formData.get('experience') ? Number(formData.get('experience')) : 0,
    strength: formData.get('strength') ? Number(formData.get('strength')) : 10,
    dexterity: formData.get('dexterity') ? Number(formData.get('dexterity')) : 10,
    constitution: formData.get('constitution') ? Number(formData.get('constitution')) : 10,
    intelligence: formData.get('intelligence') ? Number(formData.get('intelligence')) : 10,
    wisdom: formData.get('wisdom') ? Number(formData.get('wisdom')) : 10,
    charisma: formData.get('charisma') ? Number(formData.get('charisma')) : 10,
    hitPoints: formData.get('hitPoints') ? Number(formData.get('hitPoints')) : 0,
    maxHitPoints: formData.get('maxHitPoints') ? Number(formData.get('maxHitPoints')) : 0,
    armorClass: formData.get('armorClass') ? Number(formData.get('armorClass')) : 10,
    initiative: formData.get('initiative') ? Number(formData.get('initiative')) : 0,
    speed: formData.get('speed') ? Number(formData.get('speed')) : 30,
    proficiencyBonus: formData.get('proficiencyBonus') ? Number(formData.get('proficiencyBonus')) : 2,
    savingThrows: formData.get('savingThrows') ? JSON.parse(formData.get('savingThrows') as string) : [],
    skills: formData.get('skills') ? JSON.parse(formData.get('skills') as string) : [],
    equipment: formData.get('equipment') ? JSON.parse(formData.get('equipment') as string) : [],
    weapons: formData.get('weapons') ? JSON.parse(formData.get('weapons') as string) : [],
    spells: formData.get('spells') ? JSON.parse(formData.get('spells') as string) : [],
    spellcastingAbility: formData.get('spellcastingAbility'),
    spellSaveDc: formData.get('spellSaveDc') ? Number(formData.get('spellSaveDc')) : undefined,
    spellAttackBonus: formData.get('spellAttackBonus') ? Number(formData.get('spellAttackBonus')) : undefined,
    personalityTraits: formData.get('personalityTraits'),
    ideals: formData.get('ideals'),
    bonds: formData.get('bonds'),
    flaws: formData.get('flaws'),
    backstory: formData.get('backstory'),
    role: formData.get('role'),
    npcRelationships: formData.get('npcRelationships') ? JSON.parse(formData.get('npcRelationships') as string) : [],
    classes: formData.get('classes') ? JSON.parse(formData.get('classes') as string) : [],
    description: formData.get('description'),
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
    images: formData.get('images') ? JSON.parse(formData.get('images') as string) : [],
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const characterData = validatedFields.data;

  try {
    await db.update(characters)
      .set({
        ...characterData,
        savingThrows: JSON.stringify(characterData.savingThrows),
        skills: JSON.stringify(characterData.skills),
        equipment: JSON.stringify(characterData.equipment),
        weapons: JSON.stringify(characterData.weapons),
        spells: JSON.stringify(characterData.spells),
        npcRelationships: JSON.stringify(characterData.npcRelationships),
        classes: JSON.stringify(characterData.classes),
        tags: JSON.stringify(characterData.tags),
        images: JSON.stringify(characterData.images),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(characters.id, id));

    revalidatePath(`/campaigns/${characterData.campaignId}/characters`);
    return { message: 'Character updated successfully.' };
  } catch (error) {
    return {
      message: 'Database Error: Failed to update character.',
    };
  }
}

export async function deleteCharacter(id: number) {
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
    }
  } catch (error) {
    return {
      message: 'Database Error: Failed to delete character.',
    };
  }
}

export async function deleteCharacterAction(formData: FormData) {
  'use server';
  const id = Number(formData.get('id'));
  return await deleteCharacter(id);
}