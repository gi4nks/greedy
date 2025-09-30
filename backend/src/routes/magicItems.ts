import express, { Request, Response } from 'express';
import { db } from '../../db';
import { parseTags, stringifyTags } from '../utils';

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
  });

  res.json(rows);
});

router.post('/', (req: Request, res: Response) => {
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
  res.json(row);
});

router.put('/:id', (req: Request, res: Response) => {
  const { name, rarity, type, description, properties, attunement_required } = req.body;
  db.prepare(`
    UPDATE magic_items SET
      name = $name, rarity = $rarity, type = $type, description = $description, properties = $properties, attunement_required = $attunement_required
    WHERE id = $id
  `).run({
    id: req.params.id as any,
    name: name,
    rarity: rarity || null,
    type: type || null,
    description: description || null,
    properties: properties ? JSON.stringify(properties) : null,
    attunement_required: attunement_required ? 1 : 0
  });

  const row = db.prepare('SELECT * FROM magic_items WHERE id = ?').get(req.params.id as any) as any;
  if (row.properties) row.properties = JSON.parse(row.properties);
  // fetch owners
  const owners = db.prepare(`
    SELECT ch.* FROM characters ch
    JOIN character_magic_items cmi ON cmi.character_id = ch.id
    WHERE cmi.magic_item_id = ?
  `).all(req.params.id as any);
  row.owners = owners;
  res.json(row);
});

router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM magic_items WHERE id = ?').run(req.params.id as any);
  res.json({ message: 'Magic item deleted' });
});

// Assign to character(s)
// Accepts either { characterId, attuned } or { characterIds: number[] }
router.post('/:id/assign', (req: Request, res: Response) => {
  const { characterId, characterIds, attuned } = req.body as any;
  const itemId = req.params.id as any;

  if (!characterId && !(Array.isArray(characterIds) && characterIds.length > 0)) {
    return res.status(400).json({ error: 'characterId or characterIds is required' });
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
  res.json(row);
});

// Support unassign via DELETE /:id/assign/:characterId (frontend uses this)
router.delete('/:id/assign/:characterId', (req: Request, res: Response) => {
  const itemId = req.params.id as any;
  const characterIdParam = req.params.characterId;
  if (!characterIdParam) return res.status(400).json({ error: 'characterId is required' });
  const characterIdNum = Number(characterIdParam);
  db.prepare('DELETE FROM character_magic_items WHERE character_id = $characterId AND magic_item_id = $magicItemId').run({ characterId: characterIdNum, magicItemId: itemId });
  const owners = db.prepare(`
    SELECT ch.* FROM characters ch
    JOIN character_magic_items cmi ON cmi.character_id = ch.id
    WHERE cmi.magic_item_id = ?
  `).all(itemId);
  const row = db.prepare('SELECT * FROM magic_items WHERE id = ?').get(itemId) as any;
  if (row && row.properties) row.properties = JSON.parse(row.properties);
  row.owners = owners;
  res.json(row);
});

// Unassign
router.post('/:id/unassign', (req: Request, res: Response) => {
  const { characterId } = req.body;
  if (!characterId) return res.status(400).json({ error: 'characterId is required' });
  db.prepare('DELETE FROM character_magic_items WHERE character_id = $characterId AND magic_item_id = $magicItemId').run({ characterId, magicItemId: req.params.id as any });
  const owners = db.prepare(`
    SELECT ch.* FROM characters ch
    JOIN character_magic_items cmi ON cmi.character_id = ch.id
    WHERE cmi.magic_item_id = ?
  `).all(req.params.id as any);
  const row = db.prepare('SELECT * FROM magic_items WHERE id = ?').get(req.params.id as any) as any;
  if (row.properties) row.properties = JSON.parse(row.properties);
  row.owners = owners;
  res.json(row);
});

export default router;
