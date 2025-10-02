import express, { Request, Response } from 'express';
import { db } from '../../db';
import { validateBody, validateId, adventureSchema, adventureUpdateSchema } from '../middleware/validation';
import { asyncHandler, APIError } from '../middleware/errorHandler';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM adventures ORDER BY title').all();
  rows.forEach((r: any) => {
    // Add images
    r.images = db.prepare(`
      SELECT id, image_path, display_order
      FROM entity_images
      WHERE entity_type = 'adventures' AND entity_id = ?
      ORDER BY display_order ASC
    `).all(r.id);
  });
  res.json(rows);
});

router.get('/:id', validateId, (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM adventures WHERE id = ?').get(req.params.id as any);
  if (!row) {
    throw new APIError('Adventure not found', 404);
  }

  // Add images
  (row as any).images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'adventures' AND entity_id = ?
    ORDER BY display_order ASC
  `).all((row as any).id);

  res.json(row);
});

router.post('/', validateBody(adventureSchema), asyncHandler(async (req: Request, res: Response) => {
  const { slug, title, description, campaign_id } = req.body;
  const info = db.prepare('INSERT INTO adventures (slug, title, description, campaign_id) VALUES (?, ?, ?, ?)').run(slug || null, title, description || null, campaign_id || null);
  const row = db.prepare('SELECT * FROM adventures WHERE id = ?').get(info.lastInsertRowid);

  // Add images (should be empty for new adventure)
  (row as any).images = [];

  res.json(row);
}));

router.put('/:id', validateId, validateBody(adventureUpdateSchema), asyncHandler(async (req: Request, res: Response) => {
  const { slug, title, description, campaign_id } = req.body;

  // Check if adventure exists
  const existingAdventure = db.prepare('SELECT id FROM adventures WHERE id = ?').get(req.params.id as any);
  if (!existingAdventure) {
    throw new APIError('Adventure not found', 404);
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
  addField('slug', slug);
  addField('title', title);
  addField('description', description);
  addField('campaign_id', campaign_id);

  if (updateFields.length === 0) {
    // No fields to update, return current adventure
    const row = db.prepare('SELECT * FROM adventures WHERE id = ?').get(req.params.id as any);
    // Add images
    (row as any).images = db.prepare(`
      SELECT id, image_path, display_order
      FROM entity_images
      WHERE entity_type = 'adventures' AND entity_id = ?
      ORDER BY display_order ASC
    `).all((row as any).id);
    return res.json(row);
  }

  // Execute the update
  const updateQuery = `UPDATE adventures SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  updateValues.push(req.params.id);
  db.prepare(updateQuery).run(...updateValues);

  const row = db.prepare('SELECT * FROM adventures WHERE id = ?').get(req.params.id as any);

  // Add images
  (row as any).images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'adventures' AND entity_id = ?
    ORDER BY display_order ASC
  `).all((row as any).id);

  res.json(row);
}));

router.delete('/:id', validateId, asyncHandler(async (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM adventures WHERE id = ?').run(req.params.id as any);
  if (info.changes === 0) {
    throw new APIError('Adventure not found', 404);
  }
  res.json({ message: 'Adventure deleted' });
}));

export default router;
