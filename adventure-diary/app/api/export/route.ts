import { NextRequest, NextResponse } from 'next/server';
import { ExportService, ExportOptions } from '@/lib/services/export';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const options: ExportOptions = body;

    // Validate required fields
    if (!options.campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    if (!options.format || !['markdown', 'pdf', 'html', 'json'].includes(options.format)) {
      return NextResponse.json({ error: 'Invalid format. Must be markdown, pdf, html, or json' }, { status: 400 });
    }

    if (!options.sections) {
      return NextResponse.json({ error: 'sections is required' }, { status: 400 });
    }

    const result = await ExportService.exportCampaign(options);

    // Set appropriate headers based on format
    const headers: Record<string, string> = {};

    switch (options.format) {
      case 'pdf':
        headers['Content-Type'] = 'application/pdf';
        headers['Content-Disposition'] = `attachment; filename="campaign-export.pdf"`;
        break;
      case 'markdown':
        headers['Content-Type'] = 'text/markdown';
        headers['Content-Disposition'] = `attachment; filename="campaign-export.md"`;
        break;
      case 'html':
        headers['Content-Type'] = 'text/html';
        headers['Content-Disposition'] = `attachment; filename="campaign-export.html"`;
        break;
      case 'json':
        headers['Content-Type'] = 'application/json';
        headers['Content-Disposition'] = `attachment; filename="campaign-export.json"`;
        break;
    }

    // Handle different return types
    if (options.format === 'pdf' && result instanceof Buffer) {
      return new Response(new Uint8Array(result), { headers });
    } else {
      return NextResponse.json(
        typeof result === 'string' ? { content: result } : result,
        { headers }
      );
    }
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}