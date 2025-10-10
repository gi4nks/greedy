import { NextRequest, NextResponse } from 'next/server';
import { uploadImages, EntityType } from '@/lib/utils/imageUtils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const entityType = formData.get('entityType') as EntityType;
    const entityId = parseInt(formData.get('entityId') as string);

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing entityType or entityId' },
        { status: 400 }
      );
    }

    // Extract files from formData
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Upload files
    const results = await uploadImages(files, entityType, entityId);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}