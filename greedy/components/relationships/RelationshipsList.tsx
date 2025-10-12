'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Users, Heart, Shield, Sword } from 'lucide-react';
import Link from 'next/link';

interface Relationship {
  id: number;
  npcId: number;
  characterId: number;
  relationshipType: string;
  strength: number;
  trust: number;
  fear: number;
  respect: number;
  notes: string;
  npc_name: string;
  npc_type: string;
  target_name: string;
  target_type: string;
  latestEvent?: {
    description: string;
    strengthChange: number;
    date: string;
    sessionTitle?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface RelationshipsListProps {
  initialRelationships: Relationship[];
  filters: {
    npcId?: string;
    characterId?: string;
    type?: string;
  };
}

export default function RelationshipsList({ initialRelationships, filters }: RelationshipsListProps) {
  const [relationships, setRelationships] = useState<Relationship[]>(initialRelationships);
  const [loading, setLoading] = useState(false);

  const fetchRelationships = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.npcId) params.set('npcId', filters.npcId);
      if (filters.characterId) params.set('characterId', filters.characterId);
      if (filters.type) params.set('type', filters.type);

      const response = await fetch(`/api/relationships?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setRelationships(data);
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  const getRelationshipColor = (strength: number) => {
    if (strength >= 75) return 'text-green-600';
    if (strength >= 50) return 'text-blue-600';
    if (strength >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRelationshipTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ally':
      case 'friend':
        return 'badge-success';
      case 'enemy':
      case 'rival':
        return 'badge-error';
      case 'romantic':
        return 'badge-secondary';
      case 'family':
        return 'badge-primary';
      default:
        return 'badge-neutral';
    }
  };

  const getRelationshipIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ally':
      case 'friend':
        return <Users className="w-4 h-4" />;
      case 'romantic':
        return <Heart className="w-4 h-4" />;
      case 'enemy':
      case 'rival':
        return <Sword className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-base-300 rounded-full skeleton"></div>
                <div className="flex-1">
                  <div className="h-6 bg-base-300 rounded w-48 mb-2 skeleton"></div>
                  <div className="h-4 bg-base-300 rounded w-32 skeleton"></div>
                </div>
                <div className="text-right">
                  <div className="h-6 bg-base-300 rounded w-16 mb-2 skeleton"></div>
                  <div className="h-4 bg-base-300 rounded w-12 skeleton"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (relationships.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-base-content/50" />
          <h3 className="text-lg font-semibold mb-2">No Relationships Found</h3>
          <p className="text-base-content/70 mb-4">
            {Object.values(filters).some(Boolean)
              ? 'Try adjusting your filters to see more relationships.'
              : 'Start building relationships between your NPCs and player characters.'}
          </p>
          <Link href="/relationships/create">
            <Button size="sm">Create First Relationship</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {relationships.map((relationship) => (
        <Card key={relationship.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="avatar">
                <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center">
                  {getRelationshipIcon(relationship.relationshipType)}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">
                    {relationship.npc_name} ↔ {relationship.target_name}
                  </h3>
                  <Badge className={getRelationshipTypeColor(relationship.relationshipType)}>
                    {relationship.relationshipType}
                  </Badge>
                </div>

                <p className="text-sm text-base-content/70 mb-2">
                  {relationship.notes || 'No description available'}
                </p>

                {relationship.latestEvent && (
                  <p className="text-xs text-base-content/70">
                    Latest: {relationship.latestEvent.description}
                    {relationship.latestEvent.sessionTitle && ` (${relationship.latestEvent.sessionTitle})`}
                  </p>
                )}
              </div>

              <div className="text-right">
                <div className={`text-2xl font-bold ${getRelationshipColor(relationship.strength)}`}>
                  {relationship.strength}
                </div>
                <div className="text-xs text-base-content/70">Strength</div>
              </div>

              <div className="flex gap-2">
                <Link href={`/relationships/${relationship.id}/edit`}>
                  <Button variant="secondary" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="neutral"
                  className="gap-2"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this relationship?')) {
                      // Handle delete
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}