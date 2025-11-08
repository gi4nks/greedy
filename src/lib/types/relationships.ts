export interface RelationshipRecord {
  id: number;
  npcId: number;
  characterId: number;
  relationshipType: string;
  strength: number;
  trust: number;
  fear: number;
  respect: number;
  notes: string;
  isMutual: boolean;
  discoveredByPlayers: boolean;
}

export interface RelationshipLatestEvent {
  description: string;
  strengthChange: number;
  date: string;
  sessionTitle?: string;
}

export interface RelationshipSummary extends RelationshipRecord {
  npc_name: string;
  npc_type: string;
  target_name: string;
  target_type: string;
  latestEvent?: RelationshipLatestEvent;
  createdAt: string;
  updatedAt: string;
}
