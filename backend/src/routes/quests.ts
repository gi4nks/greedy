import express, { Request, Response } from 'express';
import { db } from '../../db';
import { parseTags, stringifyTags } from '../utils';
import { validateBody, validateId, questSchema, questUpdateSchema } from '../middleware/validation';
import { asyncHandler, APIError } from '../middleware/errorHandler';

const router = express.Router();

// Get all quests
router.get('/', (req: Request, res: Response) => {
  const adventure = req.query.adventure || null;
  let rows;
  if (adventure) {
    rows = db.prepare('SELECT * FROM quests WHERE adventure_id = ? ORDER BY created_at DESC').all(adventure as any);
  } else {
    rows = db.prepare('SELECT * FROM quests ORDER BY created_at DESC').all();
  }

  // Parse tags for each quest
  rows.forEach((row: any) => {
    if (row.tags) row.tags = parseTags(row.tags);

    // Add images
    row.images = db.prepare(`
      SELECT id, image_path, display_order
      FROM entity_images
      WHERE entity_type = 'quests' AND entity_id = ?
      ORDER BY display_order ASC
    `).all(row.id);
  });

  res.json(rows);
});

// Get quest by ID with objectives
router.get('/:id', validateId, (req: Request, res: Response) => {
  const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(req.params.id as any);
  if (!quest) {
    throw new APIError('Quest not found', 404);
  }

  // Parse tags
  if ((quest as any).tags) (quest as any).tags = parseTags((quest as any).tags);

  // Get objectives
  const objectives = db.prepare('SELECT * FROM quest_objectives WHERE quest_id = ? ORDER BY created_at').all(req.params.id as any);

  // Add images
  (quest as any).images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'quests' AND entity_id = ?
    ORDER BY display_order ASC
  `).all((quest as any).id);

  res.json({ ...quest, objectives });
});

// Create new quest
router.post('/', validateBody(questSchema), asyncHandler(async (req: Request, res: Response) => {
  const { adventure_id, title, description, status, priority, type, due_date, assigned_to, tags } = req.body;

  const info = db.prepare(`
    INSERT INTO quests (adventure_id, title, description, status, priority, type, due_date, assigned_to, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    adventure_id || null,
    title,
    description || '',
    status || 'active',
    priority || 'medium',
    type || 'main',
    due_date || null,
    assigned_to || null,
    stringifyTags(tags || [])
  );

  const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(info.lastInsertRowid);
  if (quest && (quest as any).tags) (quest as any).tags = parseTags((quest as any).tags);

  // Add images (should be empty for new quest)
  (quest as any).images = [];

  res.json(quest);
}));

// Update quest
router.put('/:id', validateId, validateBody(questUpdateSchema), asyncHandler(async (req: Request, res: Response) => {
  const { title, description, status, priority, type, due_date, assigned_to, tags, adventure_id } = req.body;

  // Check if quest exists
  const existingQuest = db.prepare('SELECT id FROM quests WHERE id = ?').get(req.params.id as any);
  if (!existingQuest) {
    throw new APIError('Quest not found', 404);
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
  addField('description', description);
  addField('status', status);
  addField('priority', priority);
  addField('type', type);
  addField('due_date', due_date);
  addField('assigned_to', assigned_to);
  addField('tags', stringifyTags(tags));
  addField('adventure_id', adventure_id);
  addField('updated_at', 'CURRENT_TIMESTAMP');

  if (updateFields.length === 0) {
    // No fields to update, return current quest
    const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(req.params.id as any);
    if (quest && (quest as any).tags) (quest as any).tags = parseTags((quest as any).tags);
    // Add images
    (quest as any).images = db.prepare(`
      SELECT id, image_path, display_order
      FROM entity_images
      WHERE entity_type = 'quests' AND entity_id = ?
      ORDER BY display_order ASC
    `).all((quest as any).id);
    return res.json(quest);
  }

  // Execute the update
  const updateQuery = `UPDATE quests SET ${updateFields.join(', ')} WHERE id = ?`;
  updateValues.push(req.params.id);
  db.prepare(updateQuery).run(...updateValues);

  const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(req.params.id as any);
  if (quest && (quest as any).tags) (quest as any).tags = parseTags((quest as any).tags);

  // Add images
  (quest as any).images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'quests' AND entity_id = ?
    ORDER BY display_order ASC
  `).all((quest as any).id);

  res.json(quest);
}));

// Delete quest
router.delete('/:id', validateId, asyncHandler(async (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM quests WHERE id = ?').get(req.params.id as any);
  if (!existing) {
    throw new APIError('Quest not found', 404);
  }

  db.prepare('DELETE FROM quests WHERE id = ?').run(req.params.id as any);
  res.json({ message: 'Quest deleted successfully' });
}));

// Add objective to quest
router.post('/:id/objectives', validateId, asyncHandler(async (req: Request, res: Response) => {
  const { description } = req.body;

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    throw new APIError('Objective description is required', 400);
  }

  const info = db.prepare(`
    INSERT INTO quest_objectives (quest_id, description)
    VALUES (?, ?)
  `).run(req.params.id as any, description.trim());

  const objective = db.prepare('SELECT * FROM quest_objectives WHERE id = ?').get(info.lastInsertRowid);
  res.json(objective);
}));

// Update objective
router.put('/:questId/objectives/:objectiveId', validateId, asyncHandler(async (req: Request, res: Response) => {
  const { description, completed } = req.body;

  if (description !== undefined && (typeof description !== 'string' || description.trim().length === 0)) {
    throw new APIError('Objective description cannot be empty', 400);
  }

  // Build dynamic update query
  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (description !== undefined) {
    updateFields.push('description = ?');
    updateValues.push(description.trim());
  }

  if (completed !== undefined) {
    updateFields.push('completed = ?');
    updateValues.push(completed ? 1 : 0);
  }

  if (updateFields.length > 0) {
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
  }

  if (updateFields.length === 0) {
    // No fields to update, return current objective
    const objective = db.prepare('SELECT * FROM quest_objectives WHERE id = ?').get(req.params.objectiveId as any);
    return res.json(objective);
  }

  const updateQuery = `UPDATE quest_objectives SET ${updateFields.join(', ')} WHERE id = ? AND quest_id = ?`;
  updateValues.push(req.params.objectiveId, req.params.questId);

  const result = db.prepare(updateQuery).run(...updateValues);
  if (result.changes === 0) {
    throw new APIError('Objective not found', 404);
  }

  const objective = db.prepare('SELECT * FROM quest_objectives WHERE id = ?').get(req.params.objectiveId as any);
  res.json(objective);
}));

// Delete objective
router.delete('/:questId/objectives/:objectiveId', validateId, asyncHandler(async (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM quest_objectives WHERE id = ? AND quest_id = ?').run(
    req.params.objectiveId as any,
    req.params.questId as any
  );

  if (result.changes === 0) {
    throw new APIError('Objective not found', 404);
  }

  res.json({ message: 'Objective deleted successfully' });
}));

export default router;