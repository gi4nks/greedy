import { NextRequest, NextResponse } from 'next/server';

const WIKI_BASE_URL = 'https://adnd2e.fandom.com/api.php';

interface WikiArticleResult {
  id: number;
  title: string;
  url: string;
  extract: string;
  thumbnail: null;
  content?: string;
  isFullContent?: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params;
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const full = searchParams.get('full') === 'true';

    // We now expect the title as a query parameter since our search provides titles
    if (!title) {
      return NextResponse.json({ error: 'Article title is required' }, { status: 400 });
    }

    // Get page content using MediaWiki API
    const contentUrl = `${WIKI_BASE_URL}?action=query&format=json&titles=${encodeURIComponent(title)}&prop=revisions&rvprop=content&rvslots=main`;
    
    const contentResponse = await fetch(contentUrl, {
      headers: {
        'User-Agent': 'greedy/1.0 (https://github.com/gi4nks/greedy)',
      },
    });

    if (!contentResponse.ok) {
      throw new Error(`Wiki API returned ${contentResponse.status}: ${contentResponse.statusText}`);
    }

    const contentData = await contentResponse.json();
    const pages = contentData.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    if (!page || page.missing) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const wikitext = page.revisions?.[0]?.slots?.main?.['*'] || '';
    
    // Extract a basic summary from wikitext (first paragraph)
    const lines = wikitext.split('\n').filter((line: string) => line.trim() && !line.startsWith('{'));
    const extract = lines.slice(0, 3).join(' ').substring(0, 300) + '...';

    let result: WikiArticleResult = {
      id: parseInt(pageId),
      title: page.title,
      url: `https://adnd2e.fandom.com/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
      extract: extract || 'No summary available',
      thumbnail: null // We can add thumbnail support later if needed
    };

    // Add full content if requested (we already have it from the revisions query)
    if (full) {
      result = {
        ...result,
        content: wikitext || 'No content available',
        isFullContent: true
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Wiki article error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}