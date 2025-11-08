"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Shield, Sword } from "lucide-react";
import Link from "next/link";
import type { RelationshipSummary } from "@/lib/types/relationships";

interface EntityRelationshipsProps {
  entityId: string;
  entityType: "character" | "location" | "quest" | "magic-item";
  relationships: RelationshipSummary[];
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
    // For non-character entities, use the npc_type and determine the ID from the data
    if (entityType === "character" || entityType === "magic-item") {
      const isNpcCurrent = relationship.npcId.toString() === entityId;
      const targetId = isNpcCurrent ? relationship.characterId : relationship.npcId;
      const targetType = isNpcCurrent ? relationship.target_type : relationship.npc_type;
      return `/campaigns/${campaignId}/${targetType}s/${targetId}`;
    } else {
      // For location/quest views, the related entity is in npc_type/npcId
      // but we need to handle the case where it might actually be a different type
      const targetType = relationship.npc_type || "character";
      const targetId = relationship.npcId;
      return `/campaigns/${campaignId}/${targetType}s/${targetId}`;
    }
  };

  const getEntityName = (relationship: Relationship) => {
    // For non-character entities (location, quest, etc), we need to check
    // which side of the relationship we're looking at
    // npc_name is always the "other" entity, target_name is the current entity
    if (entityType === "character" || entityType === "magic-item") {
      // For character view, determine which entity is not the current one
      const isNpcCurrent = relationship.npcId.toString() === entityId;
      return isNpcCurrent ? relationship.target_name : relationship.npc_name;
    } else {
      // For location, quest, etc views, npc_name is the related entity
      // (even though it might be a location or quest, not just an npc)
      return relationship.npc_name;
    }
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
