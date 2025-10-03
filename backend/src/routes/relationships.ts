import { Router } from 'express';
import { db } from '../../db';
import { RelationshipEvent } from '@greedy/shared/types';

const router = Router();

import { mapRelationshipRow, mapEventRowToSummary } from '../utils/dbMappers';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';

// Get all relationships (with optional filtering)
router.get('/', asyncHandler((req: Request, res: Response) => {
  const { npcId, characterId } = req.query;

  let query = `
    SELECT nr.*, 
           npc.name as npc_name, npc.character_type as npc_type,
           target.name as target_name, target.character_type as target_type,
           le.id as latest_event_id, le.description as latest_event_description, le.strength_change as latest_event_strength_change,
           le.trust_change as latest_event_trust_change, le.fear_change as latest_event_fear_change, le.respect_change as latest_event_respect_change,
           le.event_date as latest_event_date, le.session_title as latest_event_session_title
    FROM npc_relationships nr
    JOIN characters npc ON nr.npc_id = npc.id
    JOIN characters target ON nr.target_id = target.id
    LEFT JOIN (
      SELECT re.relationship_id, re.id, re.description, re.strength_change, re.trust_change, re.fear_change, re.respect_change, re.event_date, s.title as session_title
      FROM relationship_events re
      LEFT JOIN sessions s ON re.session_id = s.id
      WHERE re.id IN (
        SELECT id FROM relationship_events re2 WHERE re2.relationship_id = re.relationship_id ORDER BY re2.event_date DESC LIMIT 1
      )
    ) le ON le.relationship_id = nr.id
  `;

  const params: any[] = [];

  if (npcId) {
    query += ' WHERE nr.npc_id = ?';
    params.push(npcId);
  } else if (characterId) {
    query += ' WHERE (nr.npc_id = ? OR nr.target_id = ?) AND nr.target_type = "character"';
    params.push(characterId, characterId);
  }

  query += ' ORDER BY nr.strength DESC';

  const relationships = db.prepare(query).all(...params) as any[];

  // Transform database column names to frontend field names
  const transformedRelationships = relationships.map(rel => {
    const base = mapRelationshipRow(rel);
    // Attach optional latestEvent summary
    const latestEvent = rel.latest_event_id ? mapEventRowToSummary({
      id: rel.latest_event_id,
      description: rel.latest_event_description,
      strength_change: rel.latest_event_strength_change,
      trust_change: rel.latest_event_trust_change,
      fear_change: rel.latest_event_fear_change,
      respect_change: rel.latest_event_respect_change,
      event_date: rel.latest_event_date,
      session_title: rel.latest_event_session_title
    }) : null;

    return {
      ...base,
      history: [],
      createdAt: rel.created_at,
      updatedAt: rel.updated_at,
      npc_name: rel.npc_name,
      npc_type: rel.npc_type,
      target_name: rel.target_name,
      target_type: rel.target_type,
      latestEvent
    };
  });

  res.json(transformedRelationships);
}));

// Get a single relationship
router.get('/:relationshipId', (req, res) => {
  try {
    const { relationshipId } = req.params;
    const relationship = db.prepare('SELECT * FROM npc_relationships WHERE id = ?').get(relationshipId) as any;

    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    // Fetch events for this relationship and transform them
    const events = db.prepare(`
      SELECT re.*, s.title as session_title
      FROM relationship_events re
      LEFT JOIN sessions s ON re.session_id = s.id
      WHERE re.relationship_id = ?
      ORDER BY re.event_date DESC
    `).all(relationship.id) as (RelationshipEvent & { session_title?: string })[];

    const transformedEvents = events.map((ev: any) => ({
      id: ev.id,
      relationshipId: ev.relationship_id,
      eventType: ev.event_type,
      description: ev.description,
      impactValue: ev.strength_change || 0,
      trustChange: ev.trust_change || 0,
      fearChange: ev.fear_change || 0,
      respectChange: ev.respect_change || 0,
      sessionId: ev.session_id,
      sessionTitle: ev.session_title,
      date: ev.event_date,
      createdAt: ev.created_at
    }));

    // Transform to frontend format
    const transformedRelationship = {
      id: relationship.id,
      npcId: relationship.npc_id,
      characterId: relationship.target_id,
      relationshipType: relationship.relationship_type,
      strength: relationship.strength,
      trust: relationship.trust,
      fear: relationship.fear,
      respect: relationship.respect,
      notes: relationship.description,
      history: transformedEvents,
      createdAt: relationship.created_at,
      updatedAt: relationship.updated_at
    };

    res.json(transformedRelationship);
  } catch (error) {
    console.error('Error fetching relationship:', error);
    res.status(500).json({ error: 'Failed to fetch relationship' });
  }
});

// (duplicate handler removed)

// Get all relationships for an NPC
router.get('/npcs/:npcId/relationships', (req, res) => {
  try {
    const { npcId } = req.params;
    const relationships = db.prepare(`
      SELECT nr.*, c.name as target_name, c.character_type as target_type,
             le.id as latest_event_id, le.description as latest_event_description, le.strength_change as latest_event_strength_change,
             le.trust_change as latest_event_trust_change, le.fear_change as latest_event_fear_change, le.respect_change as latest_event_respect_change,
             le.event_date as latest_event_date, le.session_title as latest_event_session_title
      FROM npc_relationships nr
      JOIN characters c ON nr.target_id = c.id
      LEFT JOIN (
        SELECT re.relationship_id, re.id, re.description, re.strength_change, re.event_date, s.title as session_title
        FROM relationship_events re
        LEFT JOIN sessions s ON re.session_id = s.id
        WHERE re.id IN (
          SELECT id FROM relationship_events re2 WHERE re2.relationship_id = re.relationship_id ORDER BY re2.event_date DESC LIMIT 1
        )
      ) le ON le.relationship_id = nr.id
      WHERE nr.npc_id = ?
      ORDER BY nr.strength DESC
    `).all(npcId) as any[];

    // Transform database column names to frontend field names
    const transformedRelationships = relationships.map(rel => {
      const base = mapRelationshipRow(rel);
      const latestEvent = rel.latest_event_id ? mapEventRowToSummary({
        id: rel.latest_event_id,
        description: rel.latest_event_description,
        strength_change: rel.latest_event_strength_change,
        trust_change: rel.latest_event_trust_change,
        fear_change: rel.latest_event_fear_change,
        respect_change: rel.latest_event_respect_change,
        event_date: rel.latest_event_date,
        session_title: rel.latest_event_session_title
      }) : null;

      return {
        ...base,
        history: [],
        createdAt: rel.created_at,
        updatedAt: rel.updated_at,
        target_name: rel.target_name,
        target_type: rel.target_type,
        latestEvent
      };
    });

    res.json(transformedRelationships);
  } catch (error) {
    console.error('Error fetching NPC relationships:', error);
    res.status(500).json({ error: 'Failed to fetch NPC relationships' });
  }
});

// Create a new NPC relationship
router.post('/npcs/:npcId/relationships', (req, res) => {
  try {
    const { npcId } = req.params;
    const { target_id, target_type, relationship_type, strength, trust, fear, respect, description, is_mutual, discovered_by_players } = req.body;

    // Validate that NPC exists
    const npc = db.prepare('SELECT id FROM characters WHERE id = ? AND character_type = \'npc\'').get(npcId);
    if (!npc) {
      return res.status(404).json({ error: 'NPC not found' });
    }

    // Validate that target exists
    const target = db.prepare('SELECT id FROM characters WHERE id = ?').get(target_id);
    if (!target) {
      return res.status(404).json({ error: 'Target character not found' });
    }

    const result = db.prepare(`
      INSERT INTO npc_relationships (npc_id, target_id, target_type, relationship_type, strength, trust, fear, respect, description, is_mutual, discovered_by_players)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(npcId, target_id, target_type || 'character', relationship_type, strength || 0, trust || 50, fear || 0, respect || 50, description, is_mutual || 1, discovered_by_players || 0);

    const relationship = db.prepare('SELECT * FROM npc_relationships WHERE id = ?').get(result.lastInsertRowid) as any;
    
    // Transform to frontend format
    const transformedRelationship = {
      id: relationship.id,
      npcId: relationship.npc_id,
      characterId: relationship.target_id,
      relationshipType: relationship.relationship_type,
      strength: relationship.strength,
      trust: relationship.trust,
      fear: relationship.fear,
      respect: relationship.respect,
      notes: relationship.description,
      history: [],
      createdAt: relationship.created_at,
      updatedAt: relationship.updated_at
    };
    
    res.status(201).json(transformedRelationship);
  } catch (error) {
    console.error('Error creating NPC relationship:', error);
    res.status(500).json({ error: 'Failed to create NPC relationship' });
  }
});

// Update NPC relationship
router.put('/:relationshipId', (req, res) => {
  try {
    const { relationshipId } = req.params;
    const { relationship_type, strength, trust, fear, respect, description, is_mutual, discovered_by_players } = req.body;

    db.prepare(`
      UPDATE npc_relationships
      SET relationship_type = ?, strength = ?, trust = ?, fear = ?, respect = ?, description = ?, is_mutual = ?, discovered_by_players = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(relationship_type, strength, trust, fear, respect, description, is_mutual, discovered_by_players, relationshipId);

    const relationship = db.prepare('SELECT * FROM npc_relationships WHERE id = ?').get(relationshipId) as any;
    
    // Transform to frontend format
    const transformedRelationship = {
      id: relationship.id,
      npcId: relationship.npc_id,
      characterId: relationship.target_id,
      relationshipType: relationship.relationship_type,
      strength: relationship.strength,
      trust: relationship.trust,
      fear: relationship.fear,
      respect: relationship.respect,
      notes: relationship.description,
      history: [],
      createdAt: relationship.created_at,
      updatedAt: relationship.updated_at
    };
    
    res.json(transformedRelationship);
  } catch (error) {
    console.error('Error updating NPC relationship:', error);
    res.status(500).json({ error: 'Failed to update NPC relationship' });
  }
});

// Delete NPC relationship
router.delete('/:relationshipId', (req, res) => {
  try {
    const { relationshipId } = req.params;
    db.prepare('DELETE FROM npc_relationships WHERE id = ?').run(relationshipId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting NPC relationship:', error);
    res.status(500).json({ error: 'Failed to delete NPC relationship' });
  }
});

// Get relationship events/history
router.get('/:relationshipId/events', (req, res) => {
  try {
    const { relationshipId } = req.params;
    const events = db.prepare(`
      SELECT re.*, s.title as session_title
      FROM relationship_events re
      LEFT JOIN sessions s ON re.session_id = s.id
      WHERE re.relationship_id = ?
      ORDER BY re.event_date DESC
    `).all(relationshipId) as (RelationshipEvent & { session_title?: string })[];

    res.json(events);
  } catch (error) {
    console.error('Error fetching relationship events:', error);
    res.status(500).json({ error: 'Failed to fetch relationship events' });
  }
});

// Add relationship event
router.post('/:relationshipId/events', (req, res) => {
  try {
    const { relationshipId } = req.params;
    const { event_type, description, strength_change, session_id, event_date } = req.body;

    const result = db.prepare(`
      INSERT INTO relationship_events (relationship_id, event_type, description, strength_change, session_id, event_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(relationshipId, event_type, description, strength_change || 0, session_id, event_date || new Date().toISOString());

    // Update the relationship strength if there was a change
    if (strength_change && strength_change !== 0) {
      db.prepare(`
        UPDATE npc_relationships
        SET strength = strength + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(strength_change, relationshipId);
    }

    const event = db.prepare('SELECT * FROM relationship_events WHERE id = ?').get(result.lastInsertRowid) as RelationshipEvent;
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating relationship event:', error);
    res.status(500).json({ error: 'Failed to create relationship event' });
  }
});

// Update a relationship event
router.put('/events/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    const { description, strength_change, trust_change, fear_change, respect_change, session_id, event_date } = req.body;

    db.prepare(`
      UPDATE relationship_events
      SET description = ?, strength_change = ?, trust_change = ?, fear_change = ?, respect_change = ?, session_id = ?, event_date = ?, created_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(description, strength_change || 0, trust_change || 0, fear_change || 0, respect_change || 0, session_id || null, event_date || new Date().toISOString(), eventId);

    const event = db.prepare('SELECT * FROM relationship_events WHERE id = ?').get(eventId) as RelationshipEvent;
    res.json(event);
  } catch (error) {
    console.error('Error updating relationship event:', error);
    res.status(500).json({ error: 'Failed to update relationship event' });
  }
});

// Delete a relationship event
router.delete('/events/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    db.prepare('DELETE FROM relationship_events WHERE id = ?').run(eventId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting relationship event:', error);
    res.status(500).json({ error: 'Failed to delete relationship event' });
  }
});

// Get all relationships for a character (both as NPC and as target)
router.get('/characters/:characterId/relationships', (req, res) => {
  try {
    const { characterId } = req.params;

    // Relationships where character is the NPC
    const asNpc = db.prepare(`
      SELECT nr.*, c.name as target_name, c.character_type as target_type, 'as_npc' as role
      FROM npc_relationships nr
      JOIN characters c ON nr.target_id = c.id
      WHERE nr.npc_id = ?
    `).all(characterId) as any[];

    // Relationships where character is the target
    const asTarget = db.prepare(`
      SELECT nr.*, c.name as npc_name, 'as_target' as role
      FROM npc_relationships nr
      JOIN characters c ON nr.npc_id = c.id
      WHERE nr.target_id = ? AND nr.target_type = 'character'
    `).all(characterId) as any[];

    res.json({
      asNpc,
      asTarget,
      all: [...asNpc, ...asTarget]
    });
  } catch (error) {
    console.error('Error fetching character relationships:', error);
    res.status(500).json({ error: 'Failed to fetch character relationships' });
  }
});

export default router;