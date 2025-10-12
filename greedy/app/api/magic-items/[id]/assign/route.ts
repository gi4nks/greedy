import { NextRequest, NextResponse } from 'next/server';
import {
  assignMagicItemToEntities,
  unassignMagicItem,
  type AssignMagicItemPayload,
} from '@/lib/actions/magicItems';
import type { MagicItemAssignableEntity } from '@/lib/magicItems/shared';

// POST /api/magic-items/[id]/assign - Assign magic item to one or more entities
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);
    const body = (await request.json()) as AssignMagicItemPayload & { entityId?: number };

    const entityIds = body.entityIds ?? (body.entityId ? [body.entityId] : []);

    if (!body.entityType || !entityIds.length) {
      return NextResponse.json({ error: 'entityType and at least one entityId are required' }, { status: 400 });
    }

    await assignMagicItemToEntities(itemId, {
      entityType: body.entityType,
      entityIds,
      source: body.source,
      notes: body.notes,
      metadata: body.metadata,
    });

    return NextResponse.json({ message: 'Magic item assigned successfully' });
  } catch (error) {
    console.error('Error assigning magic item:', error);
    return NextResponse.json({ error: 'Failed to assign magic item' }, { status: 500 });
  }
}

// DELETE /api/magic-items/[id]/assign - Remove assignment for a specific entity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);
    const { searchParams } = new URL(request.url);

    const entityType = searchParams.get('entityType') as MagicItemAssignableEntity | null;
    const entityIdParam = searchParams.get('entityId');

    if (!entityType || !entityIdParam) {
      return NextResponse.json({ error: 'entityType and entityId query parameters are required' }, { status: 400 });
    }

    const entityId = Number(entityIdParam);

    await unassignMagicItem(itemId, entityType, entityId);
    return NextResponse.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    console.error('Error removing assignment:', error);
    return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 });
  }
}