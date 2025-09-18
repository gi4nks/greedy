import express, { Request, Response } from 'express';
import { db } from '../../db';
import { parseTags, stringifyTags } from '../utils';

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
  });

  res.json(rows);
});

// Get quest by ID with objectives
router.get('/:id', (req: Request, res: Response) => {
  const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(req.params.id as any);
  if (!quest) {
    return res.status(404).json({ error: 'Quest not found' });
  }

  // Parse tags
  if ((quest as any).tags) (quest as any).tags = parseTags((quest as any).tags);

  // Get objectives
  const objectives = db.prepare('SELECT * FROM quest_objectives WHERE quest_id = ? ORDER BY created_at').all(req.params.id as any);

  res.json({ ...quest, objectives });
});

// Create new quest
router.post('/', (req: Request, res: Response) => {
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

  res.json(quest);
});

// Update quest
router.put('/:id', (req: Request, res: Response) => {
  const { title, description, status, priority, type, due_date, assigned_to, tags, adventure_id } = req.body;

  db.prepare(`
    UPDATE quests
    SET title = ?, description = ?, status = ?, priority = ?, type = ?, due_date = ?, assigned_to = ?, tags = ?, updated_at = CURRENT_TIMESTAMP, adventure_id = ?
    WHERE id = ?
  `).run(
    title,
    description || '',
    status || 'active',
    priority || 'medium',
    type || 'main',
    due_date || null,
    assigned_to || null,
    stringifyTags(tags || []),
    adventure_id || null,
    req.params.id as any
  );

  const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(req.params.id as any);
  if (quest && (quest as any).tags) (quest as any).tags = parseTags((quest as any).tags);

  res.json(quest);
});

// Delete quest
router.delete('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM quests WHERE id = ?').get(req.params.id as any);
  if (!existing) {
    return res.status(404).json({ error: 'Quest not found' });
  }

  db.prepare('DELETE FROM quests WHERE id = ?').run(req.params.id as any);
  res.json({ message: 'Quest deleted successfully' });
});

// Add objective to quest
router.post('/:id/objectives', (req: Request, res: Response) => {
  const { description } = req.body;

  const info = db.prepare(`
    INSERT INTO quest_objectives (quest_id, description)
    VALUES (?, ?)
  `).run(req.params.id as any, description);

  const objective = db.prepare('SELECT * FROM quest_objectives WHERE id = ?').get(info.lastInsertRowid);
  res.json(objective);
});

// Update objective
router.put('/:questId/objectives/:objectiveId', (req: Request, res: Response) => {
  const { description, completed } = req.body;

  db.prepare(`
    UPDATE quest_objectives
    SET description = ?, completed = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND quest_id = ?
  `).run(description, completed ? 1 : 0, req.params.objectiveId as any, req.params.questId as any);

  const objective = db.prepare('SELECT * FROM quest_objectives WHERE id = ?').get(req.params.objectiveId as any);
  res.json(objective);
});

// Delete objective
router.delete('/:questId/objectives/:objectiveId', (req: Request, res: Response) => {
  db.prepare('DELETE FROM quest_objectives WHERE id = ? AND quest_id = ?').run(
    req.params.objectiveId as any,
    req.params.questId as any
  );
  res.json({ message: 'Objective deleted successfully' });
});

export default router;