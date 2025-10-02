import express, { Request, Response } from 'express';
import { db } from '../../db';
import { parseTags, stringifyTags } from '../utils';
import { validateBody, validateId, campaignSchema } from '../middleware/validation';
import { asyncHandler, APIError } from '../middleware/errorHandler';
import { Campaign } from '@greedy/shared';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM campaigns ORDER BY title').all();
  rows.forEach((r: any) => {
    r.tags = parseTags(r.tags);
    // Add images
    r.images = db.prepare(`
      SELECT id, image_path, display_order
      FROM entity_images
      WHERE entity_type = 'campaigns' AND entity_id = ?
      ORDER BY display_order ASC
    `).all(r.id);
  });
  res.json(rows);
});

router.get('/:id', validateId, (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id as any) as any;
  if (!row) {
    throw new APIError('Campaign not found', 404);
  }

  row.tags = parseTags(row.tags);

  // Add images
  row.images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'campaigns' AND entity_id = ?
    ORDER BY display_order ASC
  `).all(row.id);

  res.json(row);
});

router.post('/', validateBody(campaignSchema), asyncHandler(async (req: Request, res: Response) => {
  const { title, description, status, start_date, end_date, tags } = req.body;

  const info = db.prepare(`
    INSERT INTO campaigns (
      title, description, status, start_date, end_date, tags
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    title,
    description || null,
    status || 'active',
    start_date || null,
    end_date || null,
    stringifyTags(tags)
  );

  const row = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(info.lastInsertRowid) as any;
  row.tags = parseTags(row.tags);

  // Add images (should be empty for new campaign)
  row.images = [];

  res.json(row);
}));

router.put('/:id', validateId, validateBody(campaignSchema), asyncHandler(async (req: Request, res: Response) => {
  const { title, description, status, start_date, end_date, tags } = req.body;

  const info = db.prepare(`
    UPDATE campaigns SET
      title = ?, description = ?, status = ?, start_date = ?, end_date = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title,
    description || null,
    status || 'active',
    start_date || null,
    end_date || null,
    stringifyTags(tags),
    req.params.id as any
  );

  if (info.changes === 0) {
    throw new APIError('Campaign not found', 404);
  }

  const row = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id as any) as any;
  row.tags = parseTags(row.tags);

  // Add images
  row.images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'campaigns' AND entity_id = ?
    ORDER BY display_order ASC
  `).all(row.id);

  res.json(row);
}));

router.delete('/:id', validateId, asyncHandler(async (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id as any);
  if (info.changes === 0) {
    throw new APIError('Campaign not found', 404);
  }
  res.json({ message: 'Campaign deleted' });
}));

export default router;