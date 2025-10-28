"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Shield, Sword } from "lucide-react";
import Link from "next/link";

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

interface EntityRelationshipsProps {
  entityId: string;
  entityType: "character" | "location" | "quest" | "magic-item";
  relationships: Relationship[];
  campaignId?: string;
}

export default function EntityRelationships({
  entityId,
  entityType,
  relationships,
  campaignId,
}: EntityRelationshipsProps) {
  const getRelationshipColor = (strength: number) => {
    if (strength >= 75) return "text-green-600";
    if (strength >= 50) return "text-blue-600";
    if (strength >= 25) return "text-yellow-600";
    return "text-red-600";
  };

  const getRelationshipTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "ally":
      case "friend":
        return "badge-success";
      case "enemy":
      case "rival":
        return "badge-error";
      case "romantic":
        return "badge-secondary";
      case "family":
        return "badge-primary";
      default:
        return "badge-neutral";
    }
  };

  const getRelationshipIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "ally":
      case "friend":
        return <Users className="w-4 h-4" />;
      case "romantic":
        return <Heart className="w-4 h-4" />;
      case "enemy":
      case "rival":
        return <Sword className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getEntityLink = (relationship: Relationship) => {
    // Determine which entity is not the current one
    const isNpcCurrent = relationship.npcId.toString() === entityId;
    const targetId = isNpcCurrent ? relationship.characterId : relationship.npcId;
    const targetType = isNpcCurrent ? "character" : "character"; // Assuming characters for now

    return `/${targetType}s/${targetId}${campaignId ? `?campaignId=${campaignId}` : ""}`;
  };

  const getEntityName = (relationship: Relationship) => {
    // Determine which entity is not the current one
    const isNpcCurrent = relationship.npcId.toString() === entityId;
    return isNpcCurrent ? relationship.target_name : relationship.npc_name;
  };

  if (relationships.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Relationships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="w-12 h-12 mx-auto mb-4 text-base-content/50" />
            <h3 className="text-lg font-semibold mb-2">No Relationships</h3>
            <p className="text-base-content/70 mb-4">
              This {entityType.replace("-", " ")} doesn&apos;t have any relationships yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Relationships ({relationships.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {relationships.map((relationship) => (
          <div
            key={relationship.id}
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-base-200/50 transition-colors"
          >
            <div className="avatar">
              <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center">
                {getRelationshipIcon(relationship.relationshipType)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={getEntityLink(relationship)}
                  className="font-medium hover:underline truncate"
                >
                  {getEntityName(relationship)}
                </Link>
                <Badge
                  className={getRelationshipTypeColor(
                    relationship.relationshipType,
                  )}
                >
                  {relationship.relationshipType}
                </Badge>
              </div>

              {relationship.notes && (
                <p className="text-sm text-base-content/70 truncate">
                  {relationship.notes}
                </p>
              )}

              {relationship.latestEvent && (
                <p className="text-xs text-base-content/70 truncate">
                  Latest: {relationship.latestEvent.description}
                </p>
              )}
            </div>

            <div className="text-right">
              <div
                className={`text-lg font-bold ${getRelationshipColor(relationship.strength)}`}
              >
                {relationship.strength}
              </div>
              <div className="text-xs text-base-content/70">Strength</div>
            </div>
          </div>
        ))}

      </CardContent>
    </Card>
  );
}