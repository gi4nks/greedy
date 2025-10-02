import express, { Request, Response } from 'express';
import { db } from '../../db';
import { parseTags, stringifyTags } from '../utils';
import { validateBody, validateId, locationSchema, locationUpdateSchema } from '../middleware/validation';
import { asyncHandler, APIError } from '../middleware/errorHandler';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const adventure = req.query.adventure || null;
  let rows;
  if (adventure) rows = db.prepare('SELECT * FROM locations WHERE adventure_id = ?').all(adventure as any);
  else rows = db.prepare('SELECT * FROM locations').all();
  rows.forEach((r: any) => r.tags = parseTags(r.tags));
  res.json(rows);
});

router.get('/:id', validateId, (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id as any) as any;
  if (!row) {
    throw new APIError('Location not found', 404);
  }
  row.tags = parseTags(row.tags);
  res.json(row);
});

router.post('/', validateBody(locationSchema), asyncHandler(async (req: Request, res: Response) => {
  const { adventure_id, name, description, notes, tags } = req.body;
  const info = db.prepare('INSERT INTO locations (adventure_id, name, description, notes, tags) VALUES (?, ?, ?, ?, ?)').run(adventure_id || null, name, description, notes, stringifyTags(tags));
  const row = db.prepare('SELECT * FROM locations WHERE id = ?').get(info.lastInsertRowid);
  row.tags = parseTags(row.tags);
  res.json(row);
}));

router.put('/:id', validateId, validateBody(locationUpdateSchema), asyncHandler(async (req: Request, res: Response) => {
  const { name, description, notes, tags, adventure_id } = req.body;

  // Check if location exists
  const existingLocation = db.prepare('SELECT id FROM locations WHERE id = ?').get(req.params.id as any);
  if (!existingLocation) {
    throw new APIError('Location not found', 404);
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
  addField('name', name);
  addField('description', description);
  addField('notes', notes);
  addField('tags', stringifyTags(tags));
  addField('adventure_id', adventure_id);

  if (updateFields.length === 0) {
    // No fields to update, return current location
    const row = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id as any);
    row.tags = parseTags(row.tags);
    return res.json(row);
  }

  // Execute the update
  const updateQuery = `UPDATE locations SET ${updateFields.join(', ')} WHERE id = ?`;
  updateValues.push(req.params.id);
  db.prepare(updateQuery).run(...updateValues);

  // Fetch and return the updated location
  const row = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id as any);
  row.tags = parseTags(row.tags);
  res.json(row);
}));

router.delete('/:id', validateId, asyncHandler(async (req: Request, res: Response) => {
  db.prepare('DELETE FROM locations WHERE id = ?').run(req.params.id as any);
  res.json({ message: 'Location deleted' });
}));

export default router;
