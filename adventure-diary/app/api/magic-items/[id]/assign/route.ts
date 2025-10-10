import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { characterMagicItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/magic-items/[id]/assign - Assign magic item to characters
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);
    const { characterIds } = await request.json();

    if (!Array.isArray(characterIds) || characterIds.length === 0) {
      return NextResponse.json({ error: 'Character IDs must be a non-empty array' }, { status: 400 });
    }

    // Insert assignments for each character
    const assignments = characterIds.map(characterId => ({
      characterId,
      magicItemId: itemId,
      isAttuned: false,
    }));

    const results = await db.insert(characterMagicItems).values(assignments).returning();

    return NextResponse.json({ 
      message: 'Magic item assigned successfully',
      assignments: results 
    });
  } catch (error) {
    console.error('Error assigning magic item:', error);
    return NextResponse.json({ error: 'Failed to assign magic item' }, { status: 500 });
  }
}

// DELETE /api/magic-items/[id]/assign/[characterId] - Remove assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);
    const url = new URL(request.url);
    const characterId = parseInt(url.pathname.split('/').pop() || '0');

    if (!characterId) {
      return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 });
    }

    await db
      .delete(characterMagicItems)
      .where(and(
        eq(characterMagicItems.magicItemId, itemId),
        eq(characterMagicItems.characterId, characterId)
      ));

    return NextResponse.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    console.error('Error removing assignment:', error);
    return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 });
  }
}