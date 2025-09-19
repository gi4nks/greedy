import express, { Request, Response } from 'express';
import axios from 'axios';
import { db } from '../../db';
import { parseTags } from '../utils';

const router = express.Router();

// Export/Import
router.get('/export', (req: Request, res: Response) => {
  const adventures = db.prepare('SELECT * FROM adventures').all();
  const sessions = db.prepare('SELECT * FROM sessions').all();
  const characters = db.prepare('SELECT * FROM characters').all();
  const locations = db.prepare('SELECT * FROM locations').all();
  const quests = db.prepare('SELECT * FROM quests').all();
  const questObjectives = db.prepare('SELECT * FROM quest_objectives').all();
  // parse tags
  characters.forEach((c: any) => c.tags = parseTags(c.tags));
  locations.forEach((l: any) => l.tags = parseTags(l.tags));
  quests.forEach((q: any) => q.tags = parseTags(q.tags));
  res.json({ adventures, sessions, characters, locations, quests, quest_objectives: questObjectives });
});

router.post('/import', (req: Request, res: Response) => {
  const payload = req.body as any;
  if (!payload) return res.status(400).json({ error: 'No payload' });

  const tr = db.transaction(() => {
    db.prepare('DELETE FROM sessions').run();
    db.prepare('DELETE FROM characters').run();
    db.prepare('DELETE FROM locations').run();
    db.prepare('DELETE FROM quests').run();
    db.prepare('DELETE FROM quest_objectives').run();
    db.prepare('DELETE FROM adventures').run();

    const insAdv = db.prepare('INSERT INTO adventures (slug, title, description) VALUES (?, ?, ?)');
    if (payload.adventures) payload.adventures.forEach((a: any) => insAdv.run(a.slug || null, a.title, a.description));

    const insSession = db.prepare('INSERT INTO sessions (adventure_id, title, date, text) VALUES (?, ?, ?, ?)');
    if (payload.sessions) payload.sessions.forEach((s: any) => insSession.run(s.adventure_id || null, s.title, s.date, s.text));

    const insCharacter = db.prepare('INSERT INTO characters (adventure_id, name, role, description, tags) VALUES (?, ?, ?, ?, ?)');
    if (payload.characters) payload.characters.forEach((c: any) => insCharacter.run(c.adventure_id || null, c.name, c.role, c.description, JSON.stringify(c.tags || [])));
    if (payload.npcs) payload.npcs.forEach((c: any) => insCharacter.run(c.adventure_id || null, c.name, c.role, c.description, JSON.stringify(c.tags || [])));

    const insLoc = db.prepare('INSERT INTO locations (adventure_id, name, description, notes, tags) VALUES (?, ?, ?, ?, ?)');
    if (payload.locations) payload.locations.forEach((l: any) => insLoc.run(l.adventure_id || null, l.name, l.description, l.notes, JSON.stringify(l.tags || [])));

    const insQuest = db.prepare('INSERT INTO quests (adventure_id, title, description, status, priority, type, created_at, updated_at, due_date, assigned_to, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    if (payload.quests) payload.quests.forEach((q: any) => insQuest.run(q.adventure_id || null, q.title, q.description, q.status, q.priority, q.type, q.created_at, q.updated_at, q.due_date, q.assigned_to, JSON.stringify(q.tags || [])));

    const insQuestObj = db.prepare('INSERT INTO quest_objectives (quest_id, description, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
    if (payload.quest_objectives) payload.quest_objectives.forEach((o: any) => insQuestObj.run(o.quest_id, o.description, o.completed, o.created_at, o.updated_at));
  });

  try {
    tr();
    res.json({ message: 'Imported' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Search
router.get('/search', (req: Request, res: Response) => {
  const q = (String(req.query.q || '')).toLowerCase().trim();
  if (!q) return res.json({ sessions: [], npcs: [], locations: [] });

  const sessions = db.prepare('SELECT * FROM sessions').all().filter((s: any) => (s.title || '').toLowerCase().includes(q) || (s.text || '').toLowerCase().includes(q) || (s.date || '').toLowerCase().includes(q));
  const npcs = db.prepare('SELECT * FROM characters WHERE role IS NOT NULL AND length(trim(role)) > 0').all().filter((c: any) => (c.name || '').toLowerCase().includes(q) || (c.role || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q) || (parseTags(c.tags) || []).some((t: string) => t.toLowerCase().includes(q)));
  const locations = db.prepare('SELECT * FROM locations').all().filter((l: any) => (l.name || '').toLowerCase().includes(q) || (l.description || '').toLowerCase().includes(q) || (l.notes || '').toLowerCase().includes(q) || (parseTags(l.tags) || []).some((t: string) => t.toLowerCase().includes(q)));

  // parse tags before returning
  npcs.forEach((c: any) => c.tags = parseTags(c.tags));
  locations.forEach((l: any) => l.tags = parseTags(l.tags));

  res.json({ sessions, npcs, locations });
});

// Wiki proxy endpoints to avoid CORS issues
router.get('/wiki/search', async (req: Request, res: Response) => {
  try {
    const { category, limit = 20, query } = req.query;

    let apiUrl: string;
    let params: any = {
      format: 'json',
      limit: Math.min(parseInt(limit as string) || 20, 50) // Cap at 50 for performance
    };

    if (category && category !== 'all') {
      // Use search with category-specific keywords for better results
      apiUrl = 'https://adnd2e.fandom.com/api.php';
      let searchTerm = '';

      switch ((category as string).toLowerCase()) {
        case 'spells':
          searchTerm = 'spell';
          break;
        case 'monsters':
          searchTerm = 'monster';
          break;
        case 'magic items':
          searchTerm = 'magic item OR artifact OR weapon OR armor';
          break;
        case 'races':
          searchTerm = 'race OR species OR humanoid';
          break;
        case 'classes':
          searchTerm = 'class OR profession OR character class';
          break;
        default:
          searchTerm = category as string;
      }

      params = {
        ...params,
        action: 'query',
        list: 'search',
        srsearch: searchTerm,
        srnamespace: 0,
        srlimit: params.limit
      };
    } else if (query) {
      // Use search for general queries
      apiUrl = 'https://adnd2e.fandom.com/api.php';
      params = {
        ...params,
        action: 'query',
        list: 'search',
        srsearch: query as string,
        srnamespace: 0,
        srlimit: params.limit
      };
    } else {
      // Use Fandom API v1 for general listing
      apiUrl = 'https://adnd2e.fandom.com/api/v1/Articles/List';
      params = { limit: params.limit };
    }

    const response = await axios.get(apiUrl, { params });

    // Transform the response to a consistent format
    let results: any[] = [];

    if ((category && category !== 'all') || query) {
      // MediaWiki search response
      results = response.data.query?.search?.map((item: any) => ({
        id: item.pageid,
        title: item.title,
        url: `/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
        ns: item.ns
      })) || [];
    } else {
      // Fandom API v1 response
      results = response.data.items?.map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        ns: item.ns
      })) || [];
    }

    res.json({
      items: results,
      basepath: 'https://adnd2e.fandom.com',
      total: results.length
    });

  } catch (error: any) {
    console.error('Wiki search error:', error.message);
    res.status(500).json({
      error: 'Failed to search wiki',
      details: error.message
    });
  }
});

router.get('/wiki/article/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { full = 'false' } = req.query;
    console.log(`Received request for wiki article with ID: "${id}" (type: ${typeof id}), full: ${full}`);

    // Validate ID parameter
    const articleId = parseInt(id);
    console.log(`Parsed article ID: ${articleId} (isNaN: ${isNaN(articleId)}, <= 0: ${articleId <= 0})`);

    if (isNaN(articleId) || articleId <= 0) {
      console.log(`Invalid article ID validation failed for: "${id}"`);
      return res.status(400).json({ error: 'Invalid article ID' });
    }

    console.log(`Fetching wiki article details for ID: ${articleId}`);

    if (full === 'true') {
      // Get full article content using MediaWiki API
      const response = await axios.get('https://adnd2e.fandom.com/api.php', {
        params: {
          action: 'query',
          prop: 'revisions',
          rvprop: 'content',
          format: 'json',
          pageids: articleId
        },
        timeout: 10000
      });

      console.log(`MediaWiki API response status: ${response.status}`);

      const pages = response.data?.query?.pages;
      if (!pages || !pages[articleId]) {
        console.error('Article not found in MediaWiki API response');
        return res.status(404).json({ error: 'Article not found' });
      }

      const page = pages[articleId];
      const revision = page.revisions?.[0];

      if (!revision || !revision['*']) {
        console.error('No content found in article revision');
        return res.status(404).json({ error: 'Article content not found' });
      }

      console.log(`Successfully retrieved full article: ${page.title}`);

      res.json({
        id: page.pageid,
        title: page.title,
        content: revision['*'], // Full wikitext content
        url: `/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
        fullUrl: `https://adnd2e.fandom.com/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
        isFullContent: true
      });
    } else {
      // Get article extract using Fandom API v1 (original behavior)
      const response = await axios.get(`https://adnd2e.fandom.com/api/v1/Articles/Details`, {
        params: {
          ids: articleId,
          abstract: 500 // Maximum allowed value for abstract parameter
        },
        timeout: 10000 // 10 second timeout
      });

      console.log(`Fandom API response status: ${response.status}`);

      const items = response.data?.items;
      if (!items) {
        console.error('No items found in Fandom API response');
        return res.status(404).json({ error: 'Article not found - no items in response' });
      }

      const article = items ? items[Object.keys(items)[0]] : null;

      if (!article) {
        console.error('Article not found in items:', Object.keys(items));
        return res.status(404).json({ error: 'Article not found' });
      }

      console.log(`Successfully retrieved article extract: ${article.title}`);

      res.json({
        id: article.id,
        title: article.title,
        extract: article.abstract || 'No description available',
        url: article.url,
        fullUrl: `https://adnd2e.fandom.com${article.url}`,
        isFullContent: false
      });
    }

  } catch (error: any) {
    console.error('Wiki article error for ID', req.params.id, ':', error.message);

    // Handle different types of errors with specific responses
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        error: 'Request timeout',
        details: 'The wiki server took too long to respond'
      });
    }

    if (error.response) {
      console.error('API error response:', error.response.status, error.response.data);

      // Handle specific HTTP status codes
      if (error.response.status === 404) {
        return res.status(404).json({
          error: 'Article not found',
          details: 'The requested article does not exist on the wiki'
        });
      }

      if (error.response.status === 429) {
        return res.status(429).json({
          error: 'Rate limited',
          details: 'Too many requests to the wiki. Please try again later.'
        });
      }

      if (error.response.status >= 500) {
        return res.status(502).json({
          error: 'Wiki server error',
          details: 'The wiki server is experiencing issues. Please try again later.'
        });
      }

      return res.status(error.response.status).json({
        error: 'API error',
        details: error.response.data?.message || error.message
      });
    }

    // Handle network errors or other issues
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Unable to connect to the wiki server'
      });
    }

    res.status(500).json({
      error: 'Failed to get article',
      details: error.message
    });
  }
});

export default router;
