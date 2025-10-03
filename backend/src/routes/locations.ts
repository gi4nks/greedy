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
  
  // Add relationships for each location
  rows.forEach((r: any) => {
    r.tags = parseTags(r.tags);
    
    // Get character relationships
    r.characters = db.prepare(`
      SELECT cl.*, c.name as character_name, c.character_type
      FROM character_locations cl
      JOIN characters c ON cl.character_id = c.id
      WHERE cl.location_id = ?
      ORDER BY cl.is_current DESC, c.name ASC
    `).all(r.id);
    
    // Get quest relationships  
    r.quests = db.prepare(`
      SELECT ql.*, q.title as quest_title, q.status
      FROM quest_locations ql
      JOIN quests q ON ql.quest_id = q.id
      WHERE ql.location_id = ?
      ORDER BY ql.is_primary DESC, q.title ASC
    `).all(r.id);
  });
  
  res.json(rows);
});

router.get('/:id', validateId, (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id as any) as any;
  if (!row) {
    throw new APIError('Location not found', 404);
  }
  row.tags = parseTags(row.tags);
  
  // Get character relationships
  row.characters = db.prepare(`
    SELECT cl.*, c.name as character_name, c.character_type
    FROM character_locations cl
    JOIN characters c ON cl.character_id = c.id
    WHERE cl.location_id = ?
    ORDER BY cl.is_current DESC, c.name ASC
  `).all(row.id);
  
  // Get quest relationships  
  row.quests = db.prepare(`
    SELECT ql.*, q.title as quest_title, q.status
    FROM quest_locations ql
    JOIN quests q ON ql.quest_id = q.id
    WHERE ql.location_id = ?
    ORDER BY ql.is_primary DESC, q.title ASC
  `).all(row.id);
  
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

// Character-Location relationships
router.post('/:id/characters', validateId, asyncHandler(async (req: Request, res: Response) => {
  const { character_id, relationship_type = 'visits', notes = '', is_current = false } = req.body;
  
  if (!character_id) {
    throw new APIError('character_id is required', 400);
  }
  
  // Check if location and character exist
  const location = db.prepare('SELECT id FROM locations WHERE id = ?').get(req.params.id);
  const character = db.prepare('SELECT id FROM characters WHERE id = ?').get(character_id);
  
  if (!location) throw new APIError('Location not found', 404);
  if (!character) throw new APIError('Character not found', 404);
  
  // Insert or update the relationship
  const info = db.prepare(`
    INSERT OR REPLACE INTO character_locations 
    (character_id, location_id, relationship_type, notes, is_current, updated_at) 
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(character_id, req.params.id, relationship_type, notes, is_current ? 1 : 0);
  
  // Return the created relationship with character info
  const relationship = db.prepare(`
    SELECT cl.*, c.name as character_name, c.character_type
    FROM character_locations cl
    JOIN characters c ON cl.character_id = c.id
    WHERE cl.character_id = ? AND cl.location_id = ? AND cl.relationship_type = ?
  `).get(character_id, req.params.id, relationship_type);
  
  res.json(relationship);
}));

router.delete('/:id/characters/:characterId', validateId, asyncHandler(async (req: Request, res: Response) => {
  const { relationship_type } = req.query;
  
  let query = 'DELETE FROM character_locations WHERE location_id = ? AND character_id = ?';
  let params = [req.params.id, req.params.characterId];
  
  if (relationship_type) {
    query += ' AND relationship_type = ?';
    params.push(relationship_type as string);
  }
  
  const result = db.prepare(query).run(...params);
  
  if (result.changes === 0) {
    throw new APIError('Character-location relationship not found', 404);
  }
  
  res.json({ message: 'Character-location relationship deleted' });
}));

// Quest-Location relationships
router.post('/:id/quests', validateId, asyncHandler(async (req: Request, res: Response) => {
  const { quest_id, relationship_type = 'takes_place_at', notes = '', is_primary = false } = req.body;
  
  if (!quest_id) {
    throw new APIError('quest_id is required', 400);
  }
  
  // Check if location and quest exist
  const location = db.prepare('SELECT id FROM locations WHERE id = ?').get(req.params.id);
  const quest = db.prepare('SELECT id FROM quests WHERE id = ?').get(quest_id);
  
  if (!location) throw new APIError('Location not found', 404);
  if (!quest) throw new APIError('Quest not found', 404);
  
  // Insert or update the relationship
  const info = db.prepare(`
    INSERT OR REPLACE INTO quest_locations 
    (quest_id, location_id, relationship_type, notes, is_primary, updated_at) 
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(quest_id, req.params.id, relationship_type, notes, is_primary ? 1 : 0);
  
  // Return the created relationship with quest info
  const relationship = db.prepare(`
    SELECT ql.*, q.title as quest_title, q.status
    FROM quest_locations ql
    JOIN quests q ON ql.quest_id = q.id
    WHERE ql.quest_id = ? AND ql.location_id = ? AND ql.relationship_type = ?
  `).get(quest_id, req.params.id, relationship_type);
  
  res.json(relationship);
}));

router.delete('/:id/quests/:questId', validateId, asyncHandler(async (req: Request, res: Response) => {
  const { relationship_type } = req.query;
  
  let query = 'DELETE FROM quest_locations WHERE location_id = ? AND quest_id = ?';
  let params = [req.params.id, req.params.questId];
  
  if (relationship_type) {
    query += ' AND relationship_type = ?';
    params.push(relationship_type as string);
  }
  
  const result = db.prepare(query).run(...params);
  
  if (result.changes === 0) {
    throw new APIError('Quest-location relationship not found', 404);
  }
  
  res.json({ message: 'Quest-location relationship deleted' });
}));

export default router;
