import express, { Request, Response } from 'express';
import { db } from '../../db';
import { parseTags, stringifyTags } from '../utils';
import { validateBody, validateId, magicItemSchema, magicItemUpdateSchema } from '../middleware/validation';
import { asyncHandler, APIError } from '../middleware/errorHandler';

const router = express.Router();

// List magic items; optional filter by owner character
router.get('/', (req: Request, res: Response) => {
  const owner = req.query.owner || null;
  let rows;
  if (owner) {
    rows = db.prepare(`
      SELECT mi.* FROM magic_items mi
      JOIN character_magic_items cmi ON cmi.magic_item_id = mi.id
      WHERE cmi.character_id = ?
    `).all(owner as any);
  } else rows = db.prepare('SELECT * FROM magic_items').all();

  rows.forEach((r: any) => {
    if (r.properties) r.properties = JSON.parse(r.properties);
    // fetch owners
    const owners = db.prepare(`
      SELECT ch.* FROM characters ch
      JOIN character_magic_items cmi ON cmi.character_id = ch.id
      WHERE cmi.magic_item_id = ?
    `).all(r.id as any);
    r.owners = owners;

    // Add images
    r.images = db.prepare(`
      SELECT id, image_path, display_order
      FROM entity_images
      WHERE entity_type = 'magic_items' AND entity_id = ?
      ORDER BY display_order ASC
    `).all(r.id);
  });

  res.json(rows);
});

router.get('/:id', validateId, (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM magic_items WHERE id = ?').get(req.params.id as any) as any;
  if (!row) {
    throw new APIError('Magic item not found', 404);
  }

  if (row.properties) row.properties = JSON.parse(row.properties);
  // fetch owners
  const owners = db.prepare(`
    SELECT ch.* FROM characters ch
    JOIN character_magic_items cmi ON cmi.character_id = ch.id
    WHERE cmi.magic_item_id = ?
  `).all(row.id as any);
  row.owners = owners;

  // Add images
  row.images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'magic_items' AND entity_id = ?
    ORDER BY display_order ASC
  `).all(row.id);

  res.json(row);
});

router.post('/', validateBody(magicItemSchema), asyncHandler(async (req: Request, res: Response) => {
  const { name, rarity, type, description, properties, attunement_required } = req.body;

  const info = db.prepare(`
    INSERT INTO magic_items (
      id, name, rarity, type, description, properties, attunement_required
    ) VALUES (
      $id, $name, $rarity, $type, $description, $properties, $attunement_required
    )
  `).run({
    id: null,
    name: name,
    rarity: rarity || null,
    type: type || null,
    description: description || null,
    properties: properties ? JSON.stringify(properties) : null,
    attunement_required: attunement_required ? 1 : 0
  });

  const row = db.prepare('SELECT * FROM magic_items WHERE id = ?').get(info.lastInsertRowid) as any;
  if (row.properties) row.properties = JSON.parse(row.properties);
  row.owners = [];

  // Add images (should be empty for new item)
  row.images = [];

  res.json(row);
}));

router.put('/:id', validateId, validateBody(magicItemUpdateSchema), asyncHandler(async (req: Request, res: Response) => {
  const { name, rarity, type, description, properties, attunement_required } = req.body;

  // Check if magic item exists
  const existingItem = db.prepare('SELECT id FROM magic_items WHERE id = ?').get(req.params.id as any);
  if (!existingItem) {
    throw new APIError('Magic item not found', 404);
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
  addField('rarity', rarity);
  addField('type', type);
  addField('description', description);
  addField('properties', properties ? JSON.stringify(properties) : properties);
  addField('attunement_required', attunement_required ? 1 : 0);

  if (updateFields.length === 0) {
    // No fields to update, return current magic item
    const row = db.prepare('SELECT * FROM magic_items WHERE id = ?').get(req.params.id as any) as any;
    if (row.properties) row.properties = JSON.parse(row.properties);
    // fetch owners
    const owners = db.prepare(`
      SELECT ch.* FROM characters ch
      JOIN character_magic_items cmi ON cmi.character_id = ch.id
      WHERE cmi.magic_item_id = ?
    `).all(req.params.id as any);
    row.owners = owners;
    // Add images
    row.images = db.prepare(`
      SELECT id, image_path, display_order
      FROM entity_images
      WHERE entity_type = 'magic_items' AND entity_id = ?
      ORDER BY display_order ASC
    `).all(row.id);
    return res.json(row);
  }

  // Execute the update
  const updateQuery = `UPDATE magic_items SET ${updateFields.join(', ')} WHERE id = ?`;
  updateValues.push(req.params.id);
  db.prepare(updateQuery).run(...updateValues);

  const row = db.prepare('SELECT * FROM magic_items WHERE id = ?').get(req.params.id as any) as any;
  if (row.properties) row.properties = JSON.parse(row.properties);
  // fetch owners
  const owners = db.prepare(`
    SELECT ch.* FROM characters ch
    JOIN character_magic_items cmi ON cmi.character_id = ch.id
    WHERE cmi.magic_item_id = ?
  `).all(req.params.id as any);
  row.owners = owners;

  // Add images
  row.images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'magic_items' AND entity_id = ?
    ORDER BY display_order ASC
  `).all(row.id);

  res.json(row);
}));

router.delete('/:id', validateId, asyncHandler(async (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM magic_items WHERE id = ?').get(req.params.id as any);
  if (!existing) {
    throw new APIError('Magic item not found', 404);
  }

  db.prepare('DELETE FROM magic_items WHERE id = ?').run(req.params.id as any);
  res.json({ message: 'Magic item deleted successfully' });
}));

// Assign to character(s)
// Accepts either { characterId, attuned } or { characterIds: number[] }
router.post('/:id/assign', validateId, asyncHandler(async (req: Request, res: Response) => {
  const { characterId, characterIds, attuned } = req.body as any;
  const itemId = req.params.id as any;

  if (!characterId && !(Array.isArray(characterIds) && characterIds.length > 0)) {
    throw new APIError('characterId or characterIds is required', 400);
  }

  const insertStmt = db.prepare(`INSERT OR IGNORE INTO character_magic_items (character_id, magic_item_id, equipped) VALUES ($characterId, $magicItemId, $equipped)`);

  if (Array.isArray(characterIds) && characterIds.length > 0) {
    const txn = db.transaction((ids: number[]) => {
      for (const cid of ids) {
        insertStmt.run({ characterId: cid, magicItemId: itemId, equipped: 0 });
      }
    });
    txn(characterIds as number[]);
  } else {
    insertStmt.run({ characterId, magicItemId: itemId, equipped: attuned ? 1 : 0 });
  }

  const owners = db.prepare(`
    SELECT ch.* FROM characters ch
    JOIN character_magic_items cmi ON cmi.character_id = ch.id
    WHERE cmi.magic_item_id = ?
  `).all(itemId);
  const row = db.prepare('SELECT * FROM magic_items WHERE id = ?').get(itemId) as any;
  if (row && row.properties) row.properties = JSON.parse(row.properties);
  row.owners = owners;

  // Add images
  row.images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'magic_items' AND entity_id = ?
    ORDER BY display_order ASC
  `).all(row.id);

  res.json(row);
}));

// Support unassign via DELETE /:id/assign/:characterId (frontend uses this)
router.delete('/:id/assign/:characterId', validateId, asyncHandler(async (req: Request, res: Response) => {
  const itemId = req.params.id as any;
  const characterIdParam = req.params.characterId;
  if (!characterIdParam) throw new APIError('characterId is required', 400);
  const characterIdNum = Number(characterIdParam);
  if (isNaN(characterIdNum)) throw new APIError('Invalid characterId', 400);

  db.prepare('DELETE FROM character_magic_items WHERE character_id = $characterId AND magic_item_id = $magicItemId').run({ characterId: characterIdNum, magicItemId: itemId });
  const owners = db.prepare(`
    SELECT ch.* FROM characters ch
    JOIN character_magic_items cmi ON cmi.character_id = ch.id
    WHERE cmi.magic_item_id = ?
  `).all(itemId);
  const row = db.prepare('SELECT * FROM magic_items WHERE id = ?').get(itemId) as any;
  if (row && row.properties) row.properties = JSON.parse(row.properties);
  row.owners = owners;

  // Add images
  row.images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'magic_items' AND entity_id = ?
    ORDER BY display_order ASC
  `).all(row.id);

  res.json(row);
}));

// Unassign
router.post('/:id/unassign', validateId, asyncHandler(async (req: Request, res: Response) => {
  const { characterId } = req.body;
  if (!characterId) throw new APIError('characterId is required', 400);
  db.prepare('DELETE FROM character_magic_items WHERE character_id = $characterId AND magic_item_id = $magicItemId').run({ characterId, magicItemId: req.params.id as any });
  const owners = db.prepare(`
    SELECT ch.* FROM characters ch
    JOIN character_magic_items cmi ON cmi.character_id = ch.id
    WHERE cmi.magic_item_id = ?
  `).all(req.params.id as any);
  const row = db.prepare('SELECT * FROM magic_items WHERE id = ?').get(req.params.id as any) as any;
  if (row.properties) row.properties = JSON.parse(row.properties);
  row.owners = owners;

  // Add images
  row.images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'magic_items' AND entity_id = ?
    ORDER BY display_order ASC
  `).all(row.id);

  res.json(row);
}));

export default router;
