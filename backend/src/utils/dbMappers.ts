export function mapRelationshipRow(row: any) {
  return {
    id: row.id,
    npcId: row.npc_id,
    characterId: row.target_id,
    relationshipType: row.relationship_type,
    strength: row.strength,
    trust: row.trust,
    fear: row.fear,
    respect: row.respect,
    notes: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEventRowToSummary(ev: any) {
  return {
    id: ev.id,
    description: ev.description,
    impactValue: ev.strength_change || 0,
    trustChange: ev.trust_change || 0,
    fearChange: ev.fear_change || 0,
    respectChange: ev.respect_change || 0,
    date: ev.event_date,
    sessionTitle: ev.session_title,
  };
}

export default { mapRelationshipRow, mapEventRowToSummary };
