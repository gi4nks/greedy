import express, { Request, Response } from 'express';
import axios from 'axios';
import { db } from '../../db';
import { parseTags } from '../utils';
import { info, error as logError } from '../logger';

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
  if (!q) return res.json({ sessions: [], npcs: [], locations: [], characters: [], quests: [], magicItems: [] });

  const sessions = db.prepare('SELECT * FROM sessions').all().filter((s: any) => (s.title || '').toLowerCase().includes(q) || (s.text || '').toLowerCase().includes(q) || (s.date || '').toLowerCase().includes(q));
  const npcs = db.prepare('SELECT * FROM characters WHERE role IS NOT NULL AND length(trim(role)) > 0').all().filter((c: any) => (c.name || '').toLowerCase().includes(q) || (c.role || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q) || (parseTags(c.tags) || []).some((t: string) => t.toLowerCase().includes(q)));
  const locations = db.prepare('SELECT * FROM locations').all().filter((l: any) => (l.name || '').toLowerCase().includes(q) || (l.description || '').toLowerCase().includes(q) || (l.notes || '').toLowerCase().includes(q) || (parseTags(l.tags) || []).some((t: string) => t.toLowerCase().includes(q)));
  const characters = db.prepare('SELECT * FROM characters').all().filter((c: any) => (c.name || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q) || (parseTags(c.tags) || []).some((t: string) => t.toLowerCase().includes(q)));
  const quests = db.prepare('SELECT * FROM quests').all().filter((qst: any) => (qst.title || '').toLowerCase().includes(q) || (qst.description || '').toLowerCase().includes(q) || (parseTags(qst.tags) || []).some((t: string) => t.toLowerCase().includes(q)));
  const magicItems = db.prepare('SELECT * FROM magic_items').all().filter((mi: any) => (mi.name || '').toLowerCase().includes(q) || (mi.description || '').toLowerCase().includes(q) || (mi.rarity || '').toLowerCase().includes(q) || (mi.type || '').toLowerCase().includes(q));

  // Parse tags for each entity
  npcs.forEach((c: any) => c.tags = parseTags(c.tags));
  locations.forEach((l: any) => l.tags = parseTags(l.tags));
  characters.forEach((c: any) => c.tags = parseTags(c.tags));
  quests.forEach((qst: any) => qst.tags = parseTags(qst.tags));

  // Add owners to magic items
  magicItems.forEach((mi: any) => {
    const owners = db.prepare(`
      SELECT ch.* FROM characters ch
      JOIN character_magic_items cmi ON cmi.character_id = ch.id
      WHERE cmi.magic_item_id = ?
    `).all(mi.id);
    mi.owners = owners;
  });

  res.json({ sessions, npcs, locations, characters, quests, magicItems });
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
  logError('Wiki search error:', error.message);
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
  info(`Received request for wiki article with ID: "${id}" (type: ${typeof id}), full: ${full}`);

    // Validate ID parameter
    const articleId = parseInt(id);
  info(`Parsed article ID: ${articleId} (isNaN: ${isNaN(articleId)}, <= 0: ${articleId <= 0})`);

    if (isNaN(articleId) || articleId <= 0) {
  info(`Invalid article ID validation failed for: "${id}"`);
      return res.status(400).json({ error: 'Invalid article ID' });
    }

  info(`Fetching wiki article details for ID: ${articleId}`);

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

  info(`MediaWiki API response status: ${response.status}`);

      const pages = response.data?.query?.pages;
      if (!pages || !pages[articleId]) {
  logError('Article not found in MediaWiki API response');
        return res.status(404).json({ error: 'Article not found' });
      }

      const page = pages[articleId];
      const revision = page.revisions?.[0];

      if (!revision || !revision['*']) {
  logError('No content found in article revision');
        return res.status(404).json({ error: 'Article content not found' });
      }

  info(`Successfully retrieved full article: ${page.title}`);

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

  info(`Fandom API response status: ${response.status}`);

      const items = response.data?.items;
      if (!items) {
  logError('No items found in Fandom API response');
        return res.status(404).json({ error: 'Article not found - no items in response' });
      }

      const article = items ? items[Object.keys(items)[0]] : null;

      if (!article) {
  logError('Article not found in items:', Object.keys(items));
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
  logError('Wiki article error for ID', req.params.id, ':', error.message);

    // Handle different types of errors with specific responses
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        error: 'Request timeout',
        details: 'The wiki server took too long to respond'
      });
    }

    if (error.response) {
      logError('API error response:', error.response.status, error.response.data);

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

// Parking Lot routes
router.get('/parking-lot', (req: Request, res: Response) => {
  try {
    const items = db.prepare('SELECT * FROM parking_lot ORDER BY created_at DESC').all();
    // Parse tags for each item
    items.forEach((item: any) => {
      item.tags = item.tags ? JSON.parse(item.tags) : [];
    });
    res.json(items);
  } catch (error: any) {
    console.error('Failed to fetch parking lot items:', error);
    res.status(500).json({ error: 'Failed to fetch parking lot items' });
  }
});

router.post('/parking-lot', (req: Request, res: Response) => {
  try {
    const { name, description, contentType, wikiUrl, tags } = req.body;

    if (!name || !description || !contentType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const stmt = db.prepare(`
      INSERT INTO parking_lot (name, description, content_type, wiki_url, tags, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      description,
      contentType,
      wikiUrl || '',
      JSON.stringify(tags || []),
      new Date().toISOString()
    );

    res.json({ id: result.lastInsertRowid, message: 'Item added to parking lot' });
  } catch (error: any) {
    console.error('Failed to add item to parking lot:', error);
    res.status(500).json({ error: 'Failed to add item to parking lot' });
  }
});

router.delete('/parking-lot/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM parking_lot WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted from parking lot' });
  } catch (error: any) {
    console.error('Failed to delete item from parking lot:', error);
    res.status(500).json({ error: 'Failed to delete item from parking lot' });
  }
});

router.post('/parking-lot/:id/move', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetSection } = req.body;

    if (!targetSection) {
      return res.status(400).json({ error: 'Target section is required' });
    }

    // Get the item from parking lot
    const item = db.prepare('SELECT * FROM parking_lot WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Parse tags
    const tags = item.tags ? JSON.parse(item.tags) : [];

    // Move to target section based on content type and target section
    let targetTable = '';
    let insertData: any = {};

    switch (targetSection) {
      case 'characters':
        targetTable = 'characters';
        insertData = {
          adventure_id: null,
          name: item.name,
          role: item.content_type === 'monster' ? 'Monster' :
                item.content_type === 'spell' ? 'Spell' :
                item.content_type === 'race' ? 'Race' :
                item.content_type === 'class' ? 'Class' : 'Character',
          description: item.description,
          tags: JSON.stringify(tags),
          wiki_url: item.wiki_url
        };
        break;

      case 'locations':
        targetTable = 'locations';
        insertData = {
          adventure_id: null,
          name: item.name,
          description: item.description,
          notes: `Moved from parking lot (${item.content_type})`,
          tags: JSON.stringify(tags),
          wiki_url: item.wiki_url
        };
        break;

      case 'magic-items':
        targetTable = 'magic_items';
        insertData = {
          name: item.name,
          description: item.description,
          rarity: 'Unknown',
          type: item.content_type,
          tags: JSON.stringify(tags),
          wiki_url: item.wiki_url
        };
        break;

      case 'quests':
        targetTable = 'quests';
        insertData = {
          adventure_id: null,
          title: item.name,
          description: item.description,
          status: 'active',
          priority: 'medium',
          type: item.content_type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: JSON.stringify(tags)
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid target section' });
    }

    // Insert into target table
    const columns = Object.keys(insertData).join(', ');
    const placeholders = Object.keys(insertData).map(() => '?').join(', ');
    const values = Object.values(insertData);

    const insertStmt = db.prepare(`INSERT INTO ${targetTable} (${columns}) VALUES (${placeholders})`);
    insertStmt.run(...values);

    // Delete from parking lot
    const deleteStmt = db.prepare('DELETE FROM parking_lot WHERE id = ?');
    deleteStmt.run(id);

    res.json({ message: `Item moved to ${targetSection}` });
  } catch (error: any) {
    console.error('Failed to move item:', error);
    res.status(500).json({ error: 'Failed to move item' });
  }
});

export default router;
