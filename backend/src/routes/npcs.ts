import express, { Request, Response } from 'express';
import { db } from '../../db';
import { parseTags, stringifyTags } from '../utils';
import { validateBody, validateId, npcSchema } from '../middleware/validation';
import { asyncHandler, APIError } from '../middleware/errorHandler';
import { NPC } from '@greedy/shared';

const router = express.Router();

// Get all NPCs
router.get('/', (req: Request, res: Response) => {
  const adventure = req.query.adventure || null;
  let rows;
  if (adventure) {
    rows = db.prepare('SELECT * FROM characters WHERE adventure_id = ? AND role IS NOT NULL AND length(trim(role)) > 0').all(adventure as any);
  } else {
    rows = db.prepare('SELECT * FROM characters WHERE role IS NOT NULL AND length(trim(role)) > 0').all();
  }
  rows.forEach((r: any) => {
    r.tags = parseTags(r.tags);
  });
  res.json(rows);
});

// Get NPC by ID
router.get('/:id', validateId, (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM characters WHERE id = ? AND role IS NOT NULL AND length(trim(role)) > 0').get(req.params.id as any);
  if (!row) throw new APIError('NPC not found', 404);
  (row as any).tags = parseTags((row as any).tags);
  res.json(row);
});

// Create new NPC
router.post('/', validateBody(npcSchema), asyncHandler(async (req: Request, res: Response) => {
  const { adventure_id, name, role, description, tags } = req.body;

  const info = db.prepare(`
    INSERT INTO characters (adventure_id, name, role, description, tags)
    VALUES (?, ?, ?, ?, ?)
  `).run(adventure_id || null, name, role, description, stringifyTags(tags || []));

  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(info.lastInsertRowid);
  if (row) (row as any).tags = parseTags((row as any).tags);
  res.json(row);
}));

// Update NPC
router.put('/:id', validateId, validateBody(npcSchema), asyncHandler(async (req: Request, res: Response) => {
  const { adventure_id, name, role, description, tags } = req.body;

  const existing = db.prepare('SELECT * FROM characters WHERE id = ? AND role IS NOT NULL AND length(trim(role)) > 0').get(req.params.id as any);
  if (!existing) throw new APIError('NPC not found', 404);

  db.prepare(`
    UPDATE characters
    SET adventure_id = ?, name = ?, role = ?, description = ?, tags = ?
    WHERE id = ?
  `).run(adventure_id || null, name, role, description, stringifyTags(tags || []), req.params.id);

  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  if (row) (row as any).tags = parseTags((row as any).tags);
  res.json(row);
}));

// Delete NPC
router.delete('/:id', validateId, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM characters WHERE id = ? AND role IS NOT NULL AND length(trim(role)) > 0').get(req.params.id as any);
  if (!existing) throw new APIError('NPC not found', 404);

  db.prepare('DELETE FROM characters WHERE id = ?').run(req.params.id);
  res.json({ message: 'NPC deleted successfully' });
});

export default router;