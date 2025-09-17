import express, { Request, Response } from 'express';
import { db } from '../../db';
import { parseTags } from '../utils';

const router = express.Router();

// Global notes
router.get('/global_notes', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM global_notes ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/global_notes', (req: Request, res: Response) => {
  const { title, text } = req.body;
  const created_at = new Date().toISOString();
  const info = db.prepare('INSERT INTO global_notes (title, text, created_at) VALUES (?, ?, ?)').run(title, text, created_at);
  const row = db.prepare('SELECT * FROM global_notes WHERE id = ?').get(info.lastInsertRowid);
  res.json(row);
});

router.put('/global_notes/:id', (req: Request, res: Response) => {
  const { title, text } = req.body;
  db.prepare('UPDATE global_notes SET title = ?, text = ? WHERE id = ?').run(title, text, req.params.id as any);
  const row = db.prepare('SELECT * FROM global_notes WHERE id = ?').get(req.params.id as any);
  res.json(row);
});

router.delete('/global_notes/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM global_notes WHERE id = ?').run(req.params.id as any);
  res.json({ message: 'Global note deleted' });
});

// Export/Import
router.get('/export', (req: Request, res: Response) => {
  const adventures = db.prepare('SELECT * FROM adventures').all();
  const sessions = db.prepare('SELECT * FROM sessions').all();
  const npcs = db.prepare('SELECT * FROM npcs').all();
  const locations = db.prepare('SELECT * FROM locations').all();
  const global_notes = db.prepare('SELECT * FROM global_notes').all();
  // parse tags
  npcs.forEach((n: any) => n.tags = parseTags(n.tags));
  locations.forEach((l: any) => l.tags = parseTags(l.tags));
  res.json({ adventures, sessions, npcs, locations, global_notes });
});

router.post('/import', (req: Request, res: Response) => {
  const payload = req.body as any;
  if (!payload) return res.status(400).json({ error: 'No payload' });

  const tr = db.transaction(() => {
    db.prepare('DELETE FROM sessions').run();
    db.prepare('DELETE FROM npcs').run();
    db.prepare('DELETE FROM locations').run();
    db.prepare('DELETE FROM global_notes').run();
    db.prepare('DELETE FROM adventures').run();

    const insAdv = db.prepare('INSERT INTO adventures (slug, title, description) VALUES (?, ?, ?)');
    if (payload.adventures) payload.adventures.forEach((a: any) => insAdv.run(a.slug || null, a.title, a.description));

    const insSession = db.prepare('INSERT INTO sessions (adventure_id, title, date, text) VALUES (?, ?, ?, ?)');
    if (payload.sessions) payload.sessions.forEach((s: any) => insSession.run(s.adventure_id || null, s.title, s.date, s.text));

    const insNpc = db.prepare('INSERT INTO npcs (adventure_id, name, role, description, tags) VALUES (?, ?, ?, ?, ?)');
    if (payload.npcs) payload.npcs.forEach((n: any) => insNpc.run(n.adventure_id || null, n.name, n.role, n.description, JSON.stringify(n.tags || [])));

    const insLoc = db.prepare('INSERT INTO locations (adventure_id, name, description, notes, tags) VALUES (?, ?, ?, ?, ?)');
    if (payload.locations) payload.locations.forEach((l: any) => insLoc.run(l.adventure_id || null, l.name, l.description, l.notes, JSON.stringify(l.tags || [])));

    const insGlobal = db.prepare('INSERT INTO global_notes (title, text, created_at) VALUES (?, ?, ?)');
    if (payload.global_notes) payload.global_notes.forEach((g: any) => insGlobal.run(g.title, g.text, g.created_at || new Date().toISOString()));
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
  const npcs = db.prepare('SELECT * FROM npcs').all().filter((n: any) => (n.name || '').toLowerCase().includes(q) || (n.role || '').toLowerCase().includes(q) || (n.description || '').toLowerCase().includes(q) || (parseTags(n.tags) || []).some((t: string) => t.toLowerCase().includes(q)));
  const locations = db.prepare('SELECT * FROM locations').all().filter((l: any) => (l.name || '').toLowerCase().includes(q) || (l.description || '').toLowerCase().includes(q) || (l.notes || '').toLowerCase().includes(q) || (parseTags(l.tags) || []).some((t: string) => t.toLowerCase().includes(q)));
  // parse tags before returning
  npcs.forEach((n: any) => n.tags = parseTags(n.tags));
  locations.forEach((l: any) => l.tags = parseTags(l.tags));

  res.json({ sessions, npcs, locations });
});

export default router;
