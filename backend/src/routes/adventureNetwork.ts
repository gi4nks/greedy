import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

interface NetworkNode {
  id: string;
  type: 'pc' | 'npc' | 'location' | 'quest' | 'magic_item' | 'encounter';
  label: string;
  metadata: any;
}

interface NetworkEdge {
  source: string;
  target: string;
  type: 'relationship' | 'ownership' | 'location_visit' | 'quest_involvement' | 'item_location' | 'character_location' | 'quest_location';
  strength: number;
  metadata: any;
}

interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

// Helper function to calculate strength for character-location relationships
function getLocationRelationshipStrength(relationshipType: string, isCurrent: boolean): number {
  let baseStrength = 50;
  
  switch (relationshipType) {
    case 'lives_at': baseStrength = 90; break;
    case 'works_at': baseStrength = 80; break;
    case 'owns': baseStrength = 95; break;
    case 'frequents': baseStrength = 70; break;
    case 'visits': baseStrength = 40; break;
    case 'avoids': baseStrength = 20; break;
    default: baseStrength = 50; break;
  }
  
  // Boost strength if it's current location
  if (isCurrent) {
    baseStrength += 20;
  }
  
  return Math.min(baseStrength, 100);
}

// Helper function to calculate strength for quest-location relationships
function getQuestLocationStrength(relationshipType: string, isPrimary: boolean): number {
  let baseStrength = 60;
  
  switch (relationshipType) {
    case 'takes_place_at': baseStrength = 85; break;
    case 'starts_at': baseStrength = 75; break;
    case 'ends_at': baseStrength = 75; break;
    case 'leads_to': baseStrength = 65; break;
    case 'involves': baseStrength = 55; break;
    default: baseStrength = 60; break;
  }
  
  // Boost strength if it's primary location
  if (isPrimary) {
    baseStrength += 15;
  }
  
  return Math.min(baseStrength, 100);
}

// Get network data for a specific adventure
router.get('/:adventureId/network', asyncHandler(async (req: Request, res: Response) => {
  const adventureId = parseInt(req.params.adventureId);
  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];

  // 1. Get all characters in this adventure (PCs and NPCs)
  const characters = db.prepare(`
    SELECT id, name, character_type, role, class, description 
    FROM characters 
    WHERE adventure_id = ? OR adventure_id IS NULL
  `).all(adventureId) as any[];

  characters.forEach(char => {
    nodes.push({
      id: `char_${char.id}`,
      type: char.character_type === 'npc' ? 'npc' : 'pc',
      label: char.name,
      metadata: {
        id: char.id,
        role: char.role,
        class: char.class,
        description: char.description
      }
    });
  });

  // 2. Get all locations in this adventure
  const locations = db.prepare(`
    SELECT id, name, description 
    FROM locations 
    WHERE adventure_id = ? OR adventure_id IS NULL
  `).all(adventureId) as any[];

  locations.forEach(loc => {
    nodes.push({
      id: `loc_${loc.id}`,
      type: 'location',
      label: loc.name,
      metadata: {
        id: loc.id,
        description: loc.description
      }
    });
  });

  // 3. Get all quests in this adventure
  const quests = db.prepare(`
    SELECT id, title, description, status 
    FROM quests 
    WHERE adventure_id = ? OR adventure_id IS NULL
  `).all(adventureId) as any[];

  quests.forEach(quest => {
    nodes.push({
      id: `quest_${quest.id}`,
      type: 'quest',
      label: quest.title,
      metadata: {
        id: quest.id,
        description: quest.description,
        status: quest.status
      }
    });
  });

  // 4. Get all magic items in this adventure (through character ownership)
  let magicItems: any[] = [];
  try {
    magicItems = db.prepare(`
      SELECT DISTINCT mi.id, mi.name, mi.description, mi.rarity, cmi.character_id as current_owner_id
      FROM magic_items mi
      LEFT JOIN character_magic_items cmi ON mi.id = cmi.magic_item_id
      LEFT JOIN characters c ON cmi.character_id = c.id
      WHERE c.adventure_id = ? OR c.adventure_id IS NULL OR cmi.character_id IS NULL
    `).all(adventureId) as any[];
  } catch (err) {
    // Fallback for stub DB or missing schema - get all magic items
    try {
      magicItems = db.prepare(`
        SELECT id, name, description, rarity 
        FROM magic_items
      `).all() as any[];
    } catch {
      magicItems = [];
    }
  }

  magicItems.forEach(item => {
    nodes.push({
      id: `item_${item.id}`,
      type: 'magic_item',
      label: item.name,
      metadata: {
        id: item.id,
        description: item.description,
        rarity: item.rarity,
        current_owner_id: item.current_owner_id || null
      }
    });

    // Add ownership edge if item has an owner
    if (item.current_owner_id) {
      edges.push({
        source: `char_${item.current_owner_id}`,
        target: `item_${item.id}`,
        type: 'ownership',
        strength: 100, // Ownership is a strong connection
        metadata: {
          relationship: 'owns',
          item_name: item.name
        }
      });
    }
  });

  // 5. Get character relationships
  let relationships: any[] = [];
  try {
    relationships = db.prepare(`
      SELECT nr.*, 
             npc.name as npc_name, 
             target.name as target_name
      FROM npc_relationships nr
      JOIN characters npc ON nr.npc_id = npc.id
      JOIN characters target ON nr.target_id = target.id
      WHERE npc.adventure_id = ? OR target.adventure_id = ? 
         OR npc.adventure_id IS NULL OR target.adventure_id IS NULL
    `).all(adventureId, adventureId) as any[];
  } catch (err) {
    // Fallback for stub DB
    relationships = [];
  }

  relationships.forEach(rel => {
    edges.push({
      source: `char_${rel.npc_id}`,
      target: `char_${rel.target_id}`,
      type: 'relationship',
      strength: Math.abs(rel.strength || 0) + (rel.trust || 50), // Combine strength and trust
      metadata: {
        relationship_type: rel.relationship_type,
        strength: rel.strength,
        trust: rel.trust,
        fear: rel.fear,
        respect: rel.respect,
        description: rel.description
      }
    });
  });

  // 6. Get character-location relationships
  try {
    const characterLocations = db.prepare(`
      SELECT cl.*, c.name as character_name, l.name as location_name
      FROM character_locations cl
      JOIN characters c ON cl.character_id = c.id
      JOIN locations l ON cl.location_id = l.id
      WHERE c.adventure_id = ? OR c.adventure_id IS NULL
    `).all(adventureId) as any[];

    characterLocations.forEach(rel => {
      const strength = getLocationRelationshipStrength(rel.relationship_type, rel.is_current);
      edges.push({
        source: `char_${rel.character_id}`,
        target: `loc_${rel.location_id}`,
        type: 'character_location',
        strength,
        metadata: {
          relationship: rel.relationship_type,
          is_current: rel.is_current,
          notes: rel.notes,
          character_name: rel.character_name,
          location_name: rel.location_name
        }
      });
    });
  } catch (error) {
    // Character locations table might not exist, continue without it
  }

  // 7. Get quest-location relationships
  try {
    const questLocations = db.prepare(`
      SELECT ql.*, q.title as quest_title, l.name as location_name
      FROM quest_locations ql
      JOIN quests q ON ql.quest_id = q.id
      JOIN locations l ON ql.location_id = l.id
      WHERE q.adventure_id = ? OR q.adventure_id IS NULL
    `).all(adventureId) as any[];

    questLocations.forEach(rel => {
      const strength = getQuestLocationStrength(rel.relationship_type, rel.is_primary);
      edges.push({
        source: `quest_${rel.quest_id}`,
        target: `loc_${rel.location_id}`,
        type: 'quest_location',
        strength,
        metadata: {
          relationship: rel.relationship_type,
          is_primary: rel.is_primary,
          notes: rel.notes,
          quest_title: rel.quest_title,
          location_name: rel.location_name
        }
      });
    });
  } catch (error) {
    // Quest locations table might not exist, continue without it
  }

  // 8. Get combat encounters (if table exists)
  try {
    const encounters = db.prepare(`
      SELECT id, name, description, location_id 
      FROM combat_encounters 
      WHERE adventure_id = ?
    `).all(adventureId) as any[];

    encounters.forEach(enc => {
      nodes.push({
        id: `enc_${enc.id}`,
        type: 'encounter',
        label: enc.name,
        metadata: {
          id: enc.id,
          description: enc.description
        }
      });

      // Link encounter to location if specified
      if (enc.location_id) {
        edges.push({
          source: `loc_${enc.location_id}`,
          target: `enc_${enc.id}`,
          type: 'location_visit',
          strength: 75,
          metadata: {
            relationship: 'encounter_at'
          }
        });
      }
    });
  } catch (error) {
    // Combat encounters table might not exist, continue without it
  }

  const networkData: NetworkData = { nodes, edges };
  res.json(networkData);
}));

export default router;