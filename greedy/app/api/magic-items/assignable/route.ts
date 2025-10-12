import { NextRequest, NextResponse } from 'next/server';
import { searchAssignableEntities } from '@/lib/actions/magicItems';
import { SUPPORTED_MAGIC_ITEM_ENTITY_TYPES, type MagicItemAssignableEntity } from '@/lib/magicItems/shared';

function isAssignableEntityType(value: string | null): value is MagicItemAssignableEntity {
  if (!value) return false;
  return SUPPORTED_MAGIC_ITEM_ENTITY_TYPES.includes(value as MagicItemAssignableEntity);
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const entityTypeParam = url.searchParams.get('entityType');

    if (!isAssignableEntityType(entityTypeParam)) {
      return NextResponse.json({ error: 'Invalid or missing entityType' }, { status: 400 });
    }

    const search = url.searchParams.get('search') ?? undefined;
    const campaignIdParam = url.searchParams.get('campaignId');
    const limitParam = url.searchParams.get('limit');

    const campaignId = campaignIdParam ? Number.parseInt(campaignIdParam, 10) : undefined;
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

    const options = {
      search,
      campaignId: Number.isFinite(campaignId) ? campaignId : undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
    } as const;

    const results = await searchAssignableEntities(entityTypeParam, options);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to load assignable entities:', error);
    return NextResponse.json({ error: 'Failed to fetch assignable entities' }, { status: 500 });
  }
}
