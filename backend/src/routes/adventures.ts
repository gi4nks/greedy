import express, { Request, Response } from 'express';
import { db } from '../../db';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM adventures ORDER BY title').all();
  res.json(rows);
});

router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM adventures WHERE id = ?').get(req.params.id as any);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req: Request, res: Response) => {
  const { slug, title, description } = req.body;
  const info = db.prepare('INSERT INTO adventures (slug, title, description) VALUES (?, ?, ?)').run(slug, title, description);
  const row = db.prepare('SELECT * FROM adventures WHERE id = ?').get(info.lastInsertRowid);
  res.json(row);
});

router.put('/:id', (req: Request, res: Response) => {
  const { slug, title, description } = req.body;
  const info = db.prepare('UPDATE adventures SET slug = ?, title = ?, description = ? WHERE id = ?').run(slug, title, description, req.params.id as any);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  const row = db.prepare('SELECT * FROM adventures WHERE id = ?').get(req.params.id as any);
  res.json(row);
});

router.delete('/:id', (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM adventures WHERE id = ?').run(req.params.id as any);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

export default router;
