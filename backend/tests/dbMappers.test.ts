import { mapRelationshipRow, mapEventRowToSummary } from '../src/utils/dbMappers';

describe('DB Mappers', () => {
  test('mapRelationshipRow converts snake_case to camelCase', () => {
    const row = {
      id: 1,
      npc_id: 2,
      target_id: 3,
      relationship_type: 'ally',
      strength: 5,
      trust: 50,
      fear: 10,
      respect: 20,
      description: 'notes',
      created_at: '2020-01-01',
      updated_at: '2020-01-02'
    } as any;

    const mapped = mapRelationshipRow(row);
    expect(mapped).toEqual({
      id: 1,
      npcId: 2,
      characterId: 3,
      relationshipType: 'ally',
      strength: 5,
      trust: 50,
      fear: 10,
      respect: 20,
      notes: 'notes',
      createdAt: '2020-01-01',
      updatedAt: '2020-01-02'
    });
  });

  test('mapEventRowToSummary converts event row properly', () => {
    const ev = {
      id: 10,
      description: 'an event',
      strength_change: 2,
      trust_change: 5,
      fear_change: 0,
      respect_change: -1,
      event_date: '2022-01-01',
      session_title: 'Session 1'
    } as any;

    const mapped = mapEventRowToSummary(ev);
    expect(mapped).toEqual({
      id: 10,
      description: 'an event',
      impactValue: 2,
      trustChange: 5,
      fearChange: 0,
      respectChange: -1,
      date: '2022-01-01',
      sessionTitle: 'Session 1'
    });
  });
});
