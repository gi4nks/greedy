import express, { Request, Response } from 'express';
import { db } from '../../db';
import { validateBody, validateId, sessionSchema, sessionUpdateSchema } from '../middleware/validation';
import { asyncHandler, APIError } from '../middleware/errorHandler';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const adventure = req.query.adventure || null;
  let rows;
  if (adventure) {
    rows = db.prepare('SELECT * FROM sessions WHERE adventure_id = ? ORDER BY date').all(adventure as any);
  } else {
    rows = db.prepare('SELECT * FROM sessions ORDER BY date').all();
  }
  rows.forEach((r: any) => {
    // Add images
    r.images = db.prepare(`
      SELECT id, image_path, display_order
      FROM entity_images
      WHERE entity_type = 'sessions' AND entity_id = ?
      ORDER BY display_order ASC
    `).all(r.id);
  });
  res.json(rows);
});

router.get('/:id', validateId, (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id as any);
  if (!row) {
    throw new APIError('Session not found', 404);
  }

  // Add images
  (row as any).images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'sessions' AND entity_id = ?
    ORDER BY display_order ASC
  `).all((row as any).id);

  res.json(row);
});

router.post('/', validateBody(sessionSchema), asyncHandler(async (req: Request, res: Response) => {
  const { adventure_id, title, date, text } = req.body;

  const info = db.prepare('INSERT INTO sessions (adventure_id, title, date, text) VALUES (?, ?, ?, ?)').run(adventure_id || null, title, date, text);
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(info.lastInsertRowid);

  // Add images (should be empty for new session)
  (row as any).images = [];

  res.json(row);
}));

router.put('/:id', validateId, validateBody(sessionUpdateSchema), asyncHandler(async (req: Request, res: Response) => {
  const { title, date, text, adventure_id } = req.body;

  // Check if session exists
  const existingSession = db.prepare('SELECT id FROM sessions WHERE id = ?').get(req.params.id as any);
  if (!existingSession) {
    throw new APIError('Session not found', 404);
  }

  // Build dynamic update query based on provided fields
  const updateFields: string[] = [];
  const updateValues: any[] = [];

  // Helper function to add field to update if provided
  const addField = (fieldName: string, value: any) => {
    if (value !== undefined) {
      updateFields.push(`${fieldName} = ?`);
      updateValues.push(value);
    }
  };

  // Add fields that were provided in the request
  addField('title', title);
  addField('date', date);
  addField('text', text);
  addField('adventure_id', adventure_id);

  if (updateFields.length === 0) {
    // No fields to update, return current session
    const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id as any);
    // Add images
    (row as any).images = db.prepare(`
      SELECT id, image_path, display_order
      FROM entity_images
      WHERE entity_type = 'sessions' AND entity_id = ?
      ORDER BY display_order ASC
    `).all((row as any).id);
    return res.json(row);
  }

  // Execute the update
  const updateQuery = `UPDATE sessions SET ${updateFields.join(', ')} WHERE id = ?`;
  updateValues.push(req.params.id);
  db.prepare(updateQuery).run(...updateValues);

  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id as any);

  // Add images
  (row as any).images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'sessions' AND entity_id = ?
    ORDER BY display_order ASC
  `).all((row as any).id);

  res.json(row);
}));

router.delete('/:id', validateId, asyncHandler(async (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id as any);
  if (info.changes === 0) {
    throw new APIError('Session not found', 404);
  }
  res.json({ message: 'Session deleted' });
}));

export default router;
