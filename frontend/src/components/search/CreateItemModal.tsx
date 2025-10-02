import React from 'react';
import { SessionForm } from './SessionForm';
import { NpcForm } from './NpcForm';
import { LocationForm } from './LocationForm';

type FormType = 'session' | 'npc' | 'location';

interface CreateItemModalProps {
  type: FormType;
  onClose: () => void;
  onCreateSession: (data: { title: string; date: string; text: string; adventure_id?: number | null }) => void;
  onCreateNPC: (data: { name: string; role: string; description: string; tags: string[] }) => void;
  onCreateLocation: (data: { name: string; description: string; notes: string; tags: string[] }) => void;
  adventures: Array<{ id?: number; title: string }>;
  selectedAdventureId?: number;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  type,
  onClose,
  onCreateSession,
  onCreateNPC,
  onCreateLocation,
  adventures,
  selectedAdventureId,
}) => {
  if (type === 'session') {
    return (
      <SessionForm
        adventures={adventures}
        selectedAdventureId={selectedAdventureId}
        onCreate={onCreateSession}
        onCancel={onClose}
      />
    );
  } else if (type === 'npc') {
    return (
      <NpcForm
        onCreate={onCreateNPC}
        onCancel={onClose}
      />
    );
  } else if (type === 'location') {
    return (
      <LocationForm
        onCreate={onCreateLocation}
        onCancel={onClose}
      />
    );
  }
  return null;
};