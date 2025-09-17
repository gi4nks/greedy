import express, { Request, Response } from 'express';
import { db } from '../../db';
import { parseTags, stringifyTags } from '../utils';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const adventure = req.query.adventure || null;
  let rows;
  if (adventure) rows = db.prepare('SELECT * FROM characters WHERE adventure_id = ?').all(adventure as any);
  else rows = db.prepare('SELECT * FROM characters').all();
  rows.forEach((r: any) => r.tags = parseTags(r.tags));
  res.json(rows);
});

router.post('/', (req: Request, res: Response) => {
  const { adventure_id, name, role, description, tags } = req.body;
  const info = db.prepare('INSERT INTO characters (adventure_id, name, role, description, tags) VALUES (?, ?, ?, ?, ?)').run(adventure_id || null, name, role, description, stringifyTags(tags));
  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(info.lastInsertRowid);
  row.tags = parseTags(row.tags);
  res.json(row);
});

router.put('/:id', (req: Request, res: Response) => {
  const { name, role, description, tags, adventure_id } = req.body;
  db.prepare('UPDATE characters SET name = ?, role = ?, description = ?, tags = ?, adventure_id = ? WHERE id = ?').run(name, role, description, stringifyTags(tags), adventure_id || null, req.params.id as any);
  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id as any);
  row.tags = parseTags(row.tags);
  res.json(row);
});

router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM characters WHERE id = ?').run(req.params.id as any);
  res.json({ message: 'Character deleted' });
});

export default router;
