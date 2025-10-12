import { NextRequest, NextResponse } from 'next/server';
import { deleteImage, EntityType } from '@/lib/utils/imageUtils';

export async function DELETE(request: NextRequest) {
  try {
    const { filename, entityType } = await request.json();

    if (!filename || !entityType) {
      return NextResponse.json(
        { error: 'Missing filename or entityType' },
        { status: 400 }
      );
    }

    const result = await deleteImage(filename, entityType as EntityType);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}