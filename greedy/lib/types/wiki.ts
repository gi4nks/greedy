// Shared types and interfaces for wiki article functionality across all entity types

export interface WikiEntity {
  id: number;
  title: string;
  contentType: string;
  wikiUrl?: string;
  description?: string;
  parsedData?: unknown;
  relationshipType?: string;
  relationshipData?: unknown;
}

export interface WikiEntityGroup {
  [contentType: string]: WikiEntity[];
}

export interface WikiCategoryConfig {
  key: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  hoverColor: string;
  chevronColor: string;
  badgeVariant?: 'default' | 'secondary' | 'outline';
}

// Standard wiki categories used across all entity types
export const WIKI_CATEGORIES: WikiCategoryConfig[] = [
  {
    key: 'magic-item',
    title: 'Magic Items from Wiki Import',
    icon: '✨',
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-800',
    hoverColor: 'hover:bg-purple-100',
    chevronColor: 'text-purple-600',
  },
  {
    key: 'spell',
    title: 'Spells from Wiki Import',
    icon: '📜',
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    hoverColor: 'hover:bg-blue-100',
    chevronColor: 'text-blue-600',
  },
  {
    key: 'monster',
    title: 'Creatures from Wiki Import',
    icon: '🐉',
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    hoverColor: 'hover:bg-red-100',
    chevronColor: 'text-red-600',
  },
  {
    key: 'other',
    title: 'Other Items from Wiki Import',
    icon: '📄',
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-800',
    hoverColor: 'hover:bg-gray-100',
    chevronColor: 'text-gray-600',
  },
];

export interface WikiEntitiesDisplayProps {
  wikiEntities: WikiEntity[];
  entityType: 'character' | 'session' | 'quest' | 'location';
  entityId: number;
  showImportMessage?: boolean;
  onRemoveEntity?: (entityId: number, contentType: string) => void;
  isEditable?: boolean;
  removingItems?: Set<string>;
}