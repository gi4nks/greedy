import express, { Request, Response } from 'express';
import { db } from '../../db';
import { parseTags, stringifyTags } from '../utils';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const adventure = req.query.adventure || null;
  let rows;
  if (adventure) rows = db.prepare('SELECT * FROM locations WHERE adventure_id = ?').all(adventure as any);
  else rows = db.prepare('SELECT * FROM locations').all();
  rows.forEach((r: any) => r.tags = parseTags(r.tags));
  res.json(rows);
});

router.post('/', (req: Request, res: Response) => {
  const { adventure_id, name, description, notes, tags } = req.body;
  const info = db.prepare('INSERT INTO locations (adventure_id, name, description, notes, tags) VALUES (?, ?, ?, ?, ?)').run(adventure_id || null, name, description, notes, stringifyTags(tags));
  const row = db.prepare('SELECT * FROM locations WHERE id = ?').get(info.lastInsertRowid);
  row.tags = parseTags(row.tags);
  res.json(row);
});

router.put('/:id', (req: Request, res: Response) => {
  const { name, description, notes, tags, adventure_id } = req.body;
  db.prepare('UPDATE locations SET name = ?, description = ?, notes = ?, tags = ?, adventure_id = ? WHERE id = ?').run(name, description, notes, stringifyTags(tags), adventure_id || null, req.params.id as any);
  const row = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id as any);
  row.tags = parseTags(row.tags);
  res.json(row);
});

router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM locations WHERE id = ?').run(req.params.id as any);
  res.json({ message: 'Location deleted' });
});

export default router;
