import { NextRequest, NextResponse } from 'next/server';
import { unassignMagicItem } from '@/lib/actions/magicItems';

// DELETE /api/magic-items/[id]/assign/[characterId] - Remove specific assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const { id, characterId } = await params;
    const itemId = parseInt(id);
    const charId = parseInt(characterId);

    await unassignMagicItem(itemId, 'character', charId);

    return NextResponse.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    console.error('Error removing assignment:', error);
    return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 });
  }
}