"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowRight,
  Users,
  MapPin,
  BookOpen,
  Play,
  User,
  X,
} from "lucide-react";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import type { Relation, Session } from "@/lib/db/schema";

interface CampaignData {
  id: number;
  gameEditionId: number | null;
  gameEditionName: string | null;
  gameEditionVersion: string | null;
  title: string;
  description: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface RelationsPageClientProps {
  campaign: CampaignData;
  campaignId: number;
}

interface Entity {
  id: number;
  name: string;
  type: string;
  subtype?: string;
}

interface Character {
  id: number;
  characterType?: string;
  name: string;
}

interface Location {
  id: number;
  name: string;
}

interface Adventure {
  id: number;
  title: string;
}

interface NPC {
  id: number;
  name: string;
}

const ENTITY_TYPES = [
  { value: "character", label: "Character", icon: Users },
  { value: "npc", label: "NPC", icon: Users },
  { value: "location", label: "Location", icon: MapPin },
  { value: "quest", label: "Quest", icon: BookOpen },
  { value: "adventure", label: "Adventure", icon: Play },
  { value: "session", label: "Session", icon: User },
];

const RELATION_TYPES = [
  "ally", "enemy", "parent", "child", "belongs-to", "located-at",
  "member-of", "friend", "rival", "mentor", "student", "companion",
  "guardian", "ward", "leader", "follower", "owner", "property",
  "creator", "creation", "teacher", "lover", "spouse"
];

export default function RelationsPageClient({ campaign, campaignId }: RelationsPageClientProps) {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRelation, setEditingRelation] = useState<Relation | null>(null);

  // Form state
  const [sourceEntity, setSourceEntity] = useState("");
  const [targetEntity, setTargetEntity] = useState("");
  const [relationType, setRelationType] = useState("");
  const [description, setDescription] = useState("");
  const [bidirectional, setBidirectional] = useState(false);

  const fetchRelations = useCallback(async () => {
    try {
      const response = await fetch(`/api/relations?campaignId=${campaignId}`);
      if (response.ok) {
        const data = await response.json();
        setRelations(data);
      }
    } catch (error) {
      console.error("Error fetching relations:", error);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const fetchEntities = useCallback(async () => {
    try {
      // Fetch all entities for the campaign
      const [charactersRes, npcsRes, locationsRes, adventuresRes, sessionsRes] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}/characters`),
        fetch(`/api/campaigns/${campaignId}/npcs`),
        fetch(`/api/campaigns/${campaignId}/locations`),
        fetch(`/api/campaigns/${campaignId}/adventures`),
        fetch(`/api/campaigns/${campaignId}/sessions`),
      ]);

      const entities: Entity[] = [];

      if (charactersRes.ok) {
        const characters: Character[] = await charactersRes.json();
        // Separate PCs and NPCs from the characters table
        characters.forEach((character) => {
          if (character.characterType === 'pc' || !character.characterType) {
            entities.push({ id: character.id, name: character.name, type: "character", subtype: "character" });
          } else if (character.characterType === 'npc') {
            entities.push({ id: character.id, name: character.name, type: "character", subtype: "NPC" });
          }
        });
      }

      if (npcsRes.ok) {
        const npcs: NPC[] = await npcsRes.json();
        // Add NPCs from the separate NPCs table
        entities.push(...npcs.map((npc) => ({ id: npc.id, name: npc.name, type: "npc" })));
      }

      if (locationsRes.ok) {
        const locations: Location[] = await locationsRes.json();
        entities.push(...locations.map((l) => ({ id: l.id, name: l.name, type: "location" })));
      }

      if (adventuresRes.ok) {
        const adventures: Adventure[] = await adventuresRes.json();
        entities.push(...adventures.map((a) => ({ id: a.id, name: a.title, type: "adventure" })));
      }

      if (sessionsRes.ok) {
        const sessions: Session[] = await sessionsRes.json();
        entities.push(...sessions.map((s) => ({ id: s.id, name: s.title, type: "session" })));
      }

      setEntities(entities);
    } catch (error) {
      console.error("Error fetching entities:", error);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchRelations();
    fetchEntities();
  }, [campaignId, fetchRelations, fetchEntities]);

  const resetForm = () => {
    setSourceEntity("");
    setTargetEntity("");
    setRelationType("");
    setDescription("");
    setBidirectional(false);
  };

  const handleCreateRelation = async () => {
    if (!sourceEntity || !targetEntity || !relationType) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/relations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          sourceEntityType: sourceEntity.split(":")[0],
          sourceEntityId: parseInt(sourceEntity.split(":")[1]),
          targetEntityType: targetEntity.split(":")[0],
          targetEntityId: parseInt(targetEntity.split(":")[1]),
          relationType,
          description: description || undefined,
          bidirectional,
        }),
      });

      if (response.ok) {
        await fetchRelations();
        setShowCreateModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create relation");
      }
    } catch (error) {
      console.error("Error creating relation:", error);
      alert("Failed to create relation");
    }
  };

  const handleEditRelation = async () => {
    if (!editingRelation) return;

    try {
      const response = await fetch(`/api/relations/${editingRelation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationType: relationType || undefined,
          description: description || undefined,
          bidirectional,
        }),
      });

      if (response.ok) {
        await fetchRelations();
        setShowEditModal(false);
        setEditingRelation(null);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update relation");
      }
    } catch (error) {
      console.error("Error updating relation:", error);
      alert("Failed to update relation");
    }
  };

  const handleDeleteRelation = async (relationId: number) => {
    if (!confirm("Are you sure you want to delete this relation?")) {
      return;
    }

    try {
      const response = await fetch(`/api/relations/${relationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchRelations();
      } else {
        alert("Failed to delete relation");
      }
    } catch (error) {
      console.error("Error deleting relation:", error);
      alert("Failed to delete relation");
    }
  };

  const startEdit = (relation: Relation) => {
    setEditingRelation(relation);
    setSourceEntity(`${relation.sourceEntityType}:${relation.sourceEntityId}`);
    setTargetEntity(`${relation.targetEntityType}:${relation.targetEntityId}`);
    setRelationType(relation.relationType);
    setDescription(relation.description || "");
    setBidirectional(relation.bidirectional || false);
    setShowEditModal(true);
  };

  const getEntityDisplayInfo = (type: string, id: number) => {
    const entity = entities.find(e => e.type === type && e.id === id);
    if (!entity) return { name: `${type} ${id}`, badges: [type] };

    const badges = [];
    if (entity.subtype) {
      badges.push(entity.subtype);
    } else {
      badges.push(entity.type);
    }

    return { name: entity.name, badges };
  };

  const getEntityIcon = (type: string) => {
    const entityType = ENTITY_TYPES.find(et => et.value === type);
    return entityType ? entityType.icon : Users;
  };

  const filteredRelations = relations.filter(relation => {
    if (!searchTerm) return true;

    const sourceInfo = getEntityDisplayInfo(relation.sourceEntityType, relation.sourceEntityId);
    const targetInfo = getEntityDisplayInfo(relation.targetEntityType, relation.targetEntityId);

    return (
      sourceInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      targetInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.relationType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 md:p-6">
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Relation</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="source">Source Entity</Label>
                <Select name="source" value={sourceEntity} onValueChange={setSourceEntity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((entity) => {
                      const Icon = getEntityIcon(entity.type);
                      const displayType = entity.subtype ? `${entity.subtype}` : entity.type;
                      return (
                        <SelectItem key={`${entity.type}:${entity.id}`} value={`${entity.type}:${entity.id}`}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {entity.name} ({displayType})
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="target">Target Entity</Label>
                <Select name="target" value={targetEntity} onValueChange={setTargetEntity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((entity) => {
                      const Icon = getEntityIcon(entity.type);
                      const displayType = entity.subtype ? `${entity.subtype}` : entity.type;
                      return (
                        <SelectItem key={`${entity.type}:${entity.id}`} value={`${entity.type}:${entity.id}`}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {entity.name} ({displayType})
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="relationType">Relation Type</Label>
                <Select name="relationType" value={relationType} onValueChange={setRelationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace("-", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details about this relationship..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="bidirectional"
                  checked={bidirectional}
                  onChange={(e) => setBidirectional(e.target.checked)}
                  className="checkbox"
                />
                <Label htmlFor="bidirectional">Bidirectional relationship</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button onClick={handleCreateRelation}
                    variant="primary"
                    size="sm">
                  Create Relation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingRelation && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Relation</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRelation(null);
                  resetForm();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Relation Type</Label>
                <Select value={relationType} onValueChange={setRelationType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace("-", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details about this relationship..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-bidirectional"
                  checked={bidirectional}
                  onChange={(e) => setBidirectional(e.target.checked)}
                  className="checkbox"
                />
                <Label htmlFor="edit-bidirectional">Bidirectional relationship</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRelation(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditRelation}>
                  Update Relation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 md:p-6">
        {/* Breadcrumb */}
        <DynamicBreadcrumb
          campaignId={campaignId}
          campaignTitle={campaign.title}
          sectionItems={[{ label: "Relations" }]}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Relations</h1>
              <p className="text-base-content/70 mt-2">
                Define and manage relationships between characters and other entities
              </p>
            </div>
            <Button
              className="gap-2"
              onClick={() => setShowCreateModal(true)}
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Add Relation
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-4 h-4" />
            <Input
              placeholder="Search relations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Relations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Relations ({filteredRelations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRelations.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                {searchTerm ? "No relations found matching your search." : "No relations defined yet."}
                {!searchTerm && (
                  <div className="mt-4">
                    <Button onClick={() => setShowCreateModal(true)} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create your first relation
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Relation</th>
                      <th>Target</th>
                      <th>Description</th>
                      <th className="w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRelations.map((relation) => {
                      const SourceIcon = getEntityIcon(relation.sourceEntityType);
                      const TargetIcon = getEntityIcon(relation.targetEntityType);
                      const sourceInfo = getEntityDisplayInfo(relation.sourceEntityType, relation.sourceEntityId);
                      const targetInfo = getEntityDisplayInfo(relation.targetEntityType, relation.targetEntityId);

                      return (
                        <tr key={relation.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <SourceIcon className="w-4 h-4" />
                              <span className="font-medium">
                                {sourceInfo.name}
                              </span>
                              {sourceInfo.badges.map((badge, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <ArrowRight className="w-4 h-4" />
                              <Badge variant="secondary">
                                {relation.relationType.replace("-", " ")}
                              </Badge>
                              {relation.bidirectional && (
                                <Badge variant="outline" className="text-xs">
                                  ↔
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <TargetIcon className="w-4 h-4" />
                              <span className="font-medium">
                                {targetInfo.name}
                              </span>
                              {targetInfo.badges.map((badge, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="max-w-xs">
                            {relation.description ? (
                              <span className="text-sm text-base-content/70 line-clamp-2">
                                {relation.description}
                              </span>
                            ) : (
                              <span className="text-base-content/50">—</span>
                            )}
                          </td>
                          <td>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(relation)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRelation(relation.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}