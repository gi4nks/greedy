import { NextRequest, NextResponse } from 'next/server';
import {
  getMagicItemById,
  updateMagicItem,
  deleteMagicItem,
  type UpsertMagicItemInput,
} from '@/lib/actions/magicItems';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);

    const item = await getMagicItemById(itemId);

    if (!item) {
      return NextResponse.json({ error: 'Magic item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching magic item:', error);
    return NextResponse.json({ error: 'Failed to fetch magic item' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);
    const body = (await request.json()) as UpsertMagicItemInput;

    const updatedItem = await updateMagicItem(itemId, body);

    if (!updatedItem) {
      return NextResponse.json({ error: 'Magic item not found' }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating magic item:', error);
    return NextResponse.json({ error: 'Failed to update magic item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);

    await deleteMagicItem(itemId);
    return NextResponse.json({ message: 'Magic item deleted successfully' });
  } catch (error) {
    console.error('Error deleting magic item:', error);
    return NextResponse.json({ error: 'Failed to delete magic item' }, { status: 500 });
  }
}