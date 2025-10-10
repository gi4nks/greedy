'use server';

import { db } from '@/lib/db';
import { campaigns, gameEditions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const CreateCampaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  gameEditionId: z.number().optional(),
  worldName: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const UpdateCampaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gameEditionId: z.number().optional(),
  worldName: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export async function createCampaign(prevState: { errors?: Record<string, string[]>; message?: string } | undefined, formData: FormData) {
  const validatedFields = CreateCampaignSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    gameEditionId: formData.get('gameEditionId') ? Number(formData.get('gameEditionId')) : undefined,
    worldName: formData.get('worldName'),
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, description, gameEditionId, worldName, tags } = validatedFields.data;

  try {
    const [campaign] = await db.insert(campaigns).values({
      title,
      description,
      gameEditionId: gameEditionId || 1, // Default to D&D 5e
      tags: JSON.stringify(tags),
    }).returning();

    revalidatePath('/campaigns');
    redirect(`/campaigns/${campaign.id}`);
  } catch (error) {
    console.error('Database error:', error);
    return {
      message: 'Database Error: Failed to create campaign.',
    };
  }
}

export async function updateCampaign(id: number, formData: FormData) {
  const validatedFields = UpdateCampaignSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status'),
    startDate: formData.get('startDate') || undefined,
    endDate: formData.get('endDate') || undefined,
    gameEditionId: formData.get('gameEditionId') ? Number(formData.get('gameEditionId')) : undefined,
    worldName: formData.get('worldName'),
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await db.update(campaigns)
      .set({
        ...validatedFields.data,
        tags: JSON.stringify(validatedFields.data.tags),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(campaigns.id, id));

    revalidatePath(`/campaigns/${id}`);
    return { message: 'Campaign updated successfully.' };
  } catch (error) {
    console.error('Database error:', error);
    return {
      message: 'Database Error: Failed to update campaign.',
    };
  }
}

export async function deleteCampaign(id: number) {
  try {
    await db.delete(campaigns).where(eq(campaigns.id, id));
    revalidatePath('/campaigns');
    redirect('/campaigns');
  } catch (error) {
    console.error('Database error:', error);
    return {
      message: 'Database Error: Failed to delete campaign.',
    };
  }
}

export async function createCampaignDirect(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const status = formData.get('status') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const tags = formData.get('tags') as string;

  if (!title) {
    throw new Error('Title is required');
  }

  try {
    const [campaign] = await db.insert(campaigns).values({
      title,
      description: description || null,
      status: status || 'active',
      startDate: startDate || null,
      endDate: endDate || null,
      tags: tags ? JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t)) : null,
    }).returning();

    revalidatePath('/campaigns');
    redirect(`/campaigns/${campaign.id}`);
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to create campaign');
  }
}

export async function getCampaigns() {
  return await db
    .select({
      id: campaigns.id,
      title: campaigns.title,
      description: campaigns.description,
      status: campaigns.status,
      startDate: campaigns.startDate,
      endDate: campaigns.endDate,
      tags: campaigns.tags,
      gameEditionId: campaigns.gameEditionId,
      gameEditionName: gameEditions.name,
      gameEditionVersion: gameEditions.version,
      createdAt: campaigns.createdAt,
      updatedAt: campaigns.updatedAt,
    })
    .from(campaigns)
    .leftJoin(gameEditions, eq(campaigns.gameEditionId, gameEditions.id))
    .orderBy(campaigns.createdAt);
}