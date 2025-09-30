import { Router } from 'express';
import { db } from '../../db';
import { CombatEncounter, CombatParticipant, EnvironmentEffect } from '@greedy/shared/types';

const router = Router();

// Get all combat encounters (optionally filtered by sessionId)
router.get('/', (req, res) => {
  try {
    const { sessionId } = req.query;
    let encounters;

    if (sessionId) {
      encounters = db.prepare(`
        SELECT * FROM combat_encounters
        WHERE session_id = ?
        ORDER BY created_at DESC
      `).all(sessionId) as CombatEncounter[];
    } else {
      encounters = db.prepare(`
        SELECT * FROM combat_encounters
        ORDER BY created_at DESC
      `).all() as CombatEncounter[];
    }

    res.json(encounters);
  } catch (error) {
    console.error('Error fetching combat encounters:', error);
    res.status(500).json({ error: 'Failed to fetch combat encounters' });
  }
});

// Create a new combat encounter
router.post('/', (req, res) => {
  try {
    const { session_id, name, environment } = req.body;

    const result = db.prepare(`
      INSERT INTO combat_encounters (session_id, name, environment)
      VALUES (?, ?, ?)
    `).run(session_id, name, JSON.stringify(environment || []));

    const encounter = db.prepare('SELECT * FROM combat_encounters WHERE id = ?').get(result.lastInsertRowid) as CombatEncounter;

    res.status(201).json(encounter);
  } catch (error) {
    console.error('Error creating combat encounter:', error);
    res.status(500).json({ error: 'Failed to create combat encounter' });
  }
});

// Get a specific combat encounter
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const encounter = db.prepare('SELECT * FROM combat_encounters WHERE id = ?').get(id) as CombatEncounter;

    if (!encounter) {
      return res.status(404).json({ error: 'Combat encounter not found' });
    }

    res.json(encounter);
  } catch (error) {
    console.error('Error fetching combat encounter:', error);
    res.status(500).json({ error: 'Failed to fetch combat encounter' });
  }
});

// Update combat encounter
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, round, active_combatant_id, status, environment } = req.body;

    db.prepare(`
      UPDATE combat_encounters
      SET name = ?, round = ?, active_combatant_id = ?, status = ?, environment = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, round, active_combatant_id, status, JSON.stringify(environment || []), id);

    const encounter = db.prepare('SELECT * FROM combat_encounters WHERE id = ?').get(id) as CombatEncounter;
    res.json(encounter);
  } catch (error) {
    console.error('Error updating combat encounter:', error);
    res.status(500).json({ error: 'Failed to update combat encounter' });
  }
});

// Delete combat encounter
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM combat_encounters WHERE id = ?').run(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting combat encounter:', error);
    res.status(500).json({ error: 'Failed to delete combat encounter' });
  }
});

// Get participants for a combat encounter
router.get('/:encounterId/participants', (req, res) => {
  try {
    const { encounterId } = req.params;
    const participants = db.prepare(`
      SELECT cp.*, c.name, c.character_type, c.race, c.class, c.level
      FROM combat_participants cp
      JOIN characters c ON cp.character_id = c.id
      WHERE cp.encounter_id = ?
      ORDER BY cp.initiative DESC
    `).all(encounterId) as (CombatParticipant & { name: string; character_type: string; race?: string; class?: string; level?: number })[];

    res.json(participants);
  } catch (error) {
    console.error('Error fetching combat participants:', error);
    res.status(500).json({ error: 'Failed to fetch combat participants' });
  }
});

// Create a new combat participant
router.post('/participants', (req, res) => {
  try {
    const { encounter_id, character_id, initiative, current_hp, max_hp, armor_class, conditions, notes } = req.body;

    // Check if character exists
    const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(character_id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const result = db.prepare(`
      INSERT INTO combat_participants (encounter_id, character_id, initiative, current_hp, max_hp, armor_class, conditions, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(encounter_id, character_id, initiative, current_hp, max_hp, armor_class, JSON.stringify(conditions || []), notes);

    const participant = db.prepare('SELECT * FROM combat_participants WHERE id = ?').get(result.lastInsertRowid) as CombatParticipant;
    res.status(201).json(participant);
  } catch (error) {
    console.error('Error creating combat participant:', error);
    res.status(500).json({ error: 'Failed to create combat participant' });
  }
});

// Update combat participant
router.put('/participants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { initiative, current_hp, max_hp, armor_class, conditions, notes, has_action, has_bonus_action, has_reaction, has_movement, position } = req.body;

    db.prepare(`
      UPDATE combat_participants
      SET initiative = ?, current_hp = ?, max_hp = ?, armor_class = ?, conditions = ?, notes = ?, has_action = ?, has_bonus_action = ?, has_reaction = ?, has_movement = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(initiative, current_hp, max_hp, armor_class, JSON.stringify(conditions || []), notes, has_action, has_bonus_action, has_reaction, has_movement, position, id);

    const participant = db.prepare('SELECT * FROM combat_participants WHERE id = ?').get(id) as CombatParticipant;
    res.json(participant);
  } catch (error) {
    console.error('Error updating combat participant:', error);
    res.status(500).json({ error: 'Failed to update combat participant' });
  }
});

// Delete combat participant
router.delete('/participants/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM combat_participants WHERE id = ?').run(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting combat participant:', error);
    res.status(500).json({ error: 'Failed to delete combat participant' });
  }
});

export default router;