'use server';

import { db } from '@/lib/db';
import { sessions, sessionLogs, adventures, campaigns, wikiArticleEntities, wikiArticles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getSessions() {
  return await db
    .select({
      id: sessions.id,
      adventureId: sessions.adventureId,
      title: sessions.title,
      date: sessions.date,
      text: sessions.text,
      images: sessions.images,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
      campaignId: adventures.campaignId,
      campaignTitle: campaigns.title,
    })
    .from(sessions)
    .leftJoin(adventures, eq(sessions.adventureId, adventures.id))
    .leftJoin(campaigns, eq(adventures.campaignId, campaigns.id))
    .orderBy(sessions.date);
}

export async function getSession(id: number) {
  const [result] = await db
    .select({
      id: sessions.id,
      adventureId: sessions.adventureId,
      title: sessions.title,
      date: sessions.date,
      text: sessions.text,
      images: sessions.images,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
      campaignId: adventures.campaignId,
      campaignTitle: campaigns.title,
    })
    .from(sessions)
    .leftJoin(adventures, eq(sessions.adventureId, adventures.id))
    .leftJoin(campaigns, eq(adventures.campaignId, campaigns.id))
    .where(eq(sessions.id, id))
    .limit(1);

  if (!result) return null;

  // Get assigned wiki entities
  const wikiEntitiesResult = await db
    .select({
      id: wikiArticles.id,
      title: wikiArticles.title,
      contentType: wikiArticles.contentType,
      wikiUrl: wikiArticles.wikiUrl,
      description: wikiArticles.rawContent, // Map rawContent to description for frontend compatibility
      parsedData: wikiArticles.parsedData,
      relationshipType: wikiArticleEntities.relationshipType,
      relationshipData: wikiArticleEntities.relationshipData,
    })
    .from(wikiArticleEntities)
    .innerJoin(wikiArticles, eq(wikiArticleEntities.wikiArticleId, wikiArticles.id))
    .where(sql`${wikiArticleEntities.entityType} = 'session' AND ${wikiArticleEntities.entityId} = ${id}`);

  return {
    ...result,
    wikiEntities: wikiEntitiesResult.map(entity => ({
      ...entity,
      wikiUrl: entity.wikiUrl || undefined,
      description: entity.description || undefined,
      relationshipType: entity.relationshipType || undefined,
    })),
  };
}

export async function createSession(formData: FormData) {
  const title = formData.get('title') as string;
  const date = formData.get('date') as string;
  const adventureId = formData.get('adventureId') ? Number(formData.get('adventureId')) : null;
  const text = formData.get('text') as string;
  const images = formData.get('images') as string;
  const campaignId = formData.get('campaignId') as string;

  if (!title || !date) {
    throw new Error('Title and date are required');
  }

  try {
    const [session] = await db.insert(sessions).values({
      title,
      date,
      adventureId,
      text: text || null,
      images: images ? JSON.parse(images) : null,
    }).returning();

    // Revalidate campaign-specific sessions path
    if (campaignId) {
      revalidatePath(`/campaigns/${campaignId}/sessions`);
    } else {
      revalidatePath('/sessions');
    }
    
    return { success: true, session };
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to create session');
  }
}

export async function createSessionLog(formData: FormData) {
  const sessionId = Number(formData.get('sessionId'));
  const entryType = formData.get('entryType') as string;
  const timestamp = formData.get('timestamp') as string;
  const content = formData.get('content') as string;
  const tags = formData.get('tags') as string;

  if (!sessionId || !entryType || !content) {
    throw new Error('Session ID, entry type, and content are required');
  }

  try {
    await db.insert(sessionLogs).values({
      sessionId,
      entryType,
      timestamp: timestamp || null,
      content,
      tags: tags ? JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t)) : null,
    });

    revalidatePath(`/sessions/${sessionId}`);
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to create session log');
  }
}

export async function updateSession(formData: FormData) {
  const id = Number(formData.get('id'));
  const title = formData.get('title') as string;
  const date = formData.get('date') as string;
  const adventureId = formData.get('adventureId') ? Number(formData.get('adventureId')) : null;
  const text = formData.get('text') as string;
  const images = formData.get('images') as string;
  const campaignId = formData.get('campaignId') as string;

  if (!title || !date) {
    throw new Error('Title and date are required');
  }

  try {
    const [session] = await db
      .update(sessions)
      .set({
        title,
        date,
        adventureId,
        text: text || null,
        images: images ? JSON.parse(images) : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, id))
      .returning();

    // Revalidate campaign-specific sessions path
    if (campaignId) {
      revalidatePath(`/campaigns/${campaignId}/sessions`);
    } else {
      revalidatePath('/sessions');
    }
    
    return { success: true, session };
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to update session');
  }
}

export async function getSessionLogs(sessionId: number) {
  return await db.select().from(sessionLogs).where(eq(sessionLogs.sessionId, sessionId)).orderBy(sessionLogs.timestamp);
}

export async function deleteSession(id: number) {
  try {
    // First get the session to determine campaign context for revalidation
    const session = await getSession(id);
    
    // Delete associated session logs first
    await db.delete(sessionLogs).where(eq(sessionLogs.sessionId, id));
    
    // Delete the session
    await db.delete(sessions).where(eq(sessions.id, id));

    // Revalidate appropriate paths
    if (session?.campaignId) {
      revalidatePath(`/campaigns/${session.campaignId}/sessions`);
    } else {
      revalidatePath('/sessions');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to delete session');
  }
}

export async function deleteSessionAction(formData: FormData) {
  'use server';
  const id = Number(formData.get('id'));
  await deleteSession(id);
}