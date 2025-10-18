import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  campaigns,
  adventures,
  sessions,
  quests,
  characters,
  locations,
  npcs,
  magicItems,
  magicItemAssignments,
  relations,
} from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

type GraphNode = {
  id: string;
  type:
    | "campaign"
    | "adventure"
    | "session"
    | "quest"
    | "character"
    | "location"
    | "npc"
    | "magicItem";
  name: string;
  href?: string | null;
  data?: Record<string, unknown>;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  relation: string;
  data?: Record<string, unknown>;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const campaignId = Number(id);
    const { searchParams } = new URL(request.url);
    const includeRelationships = searchParams.get("includeRelationships") === "true";

    if (!Number.isInteger(campaignId)) {
      return NextResponse.json(
        { error: "Invalid campaign ID" },
        { status: 400 },
      );
    }

    const [campaign] = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        status: campaigns.status,
      })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeMap = new Map<string, GraphNode>();
    const edgeIds = new Set<string>();

    const addNode = (node: GraphNode) => {
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, node);
        nodes.push(node);
      }
    };

    const addEdge = (edge: Omit<GraphEdge, "id">) => {
      const edgeId = `${edge.source}->${edge.target}:${edge.relation}`;
      if (!edgeIds.has(edgeId)) {
        edgeIds.add(edgeId);
        edges.push({ id: edgeId, ...edge });
      }
    };

    const campaignNodeId = `campaign-${campaign.id}`;
    addNode({
      id: campaignNodeId,
      type: "campaign",
      name: campaign.title,
      href: `/campaigns/${campaign.id}`,
      data: {
        status: campaign.status,
      },
    });

    const campaignAdventures = await db
      .select({
        id: adventures.id,
        title: adventures.title,
        status: adventures.status,
      })
      .from(adventures)
      .where(eq(adventures.campaignId, campaignId));

    const adventureIds = campaignAdventures.map((adventure) => adventure.id);

    campaignAdventures.forEach((adventure) => {
      const nodeId = `adventure-${adventure.id}`;
      addNode({
        id: nodeId,
        type: "adventure",
        name: adventure.title,
        href: `/campaigns/${campaign.id}/adventures/${adventure.id}`,
        data: { status: adventure.status },
      });

      addEdge({
        source: campaignNodeId,
        target: nodeId,
        relation: "includes",
      });
    });

    const campaignSessions = adventureIds.length
      ? await db
          .select({
            id: sessions.id,
            title: sessions.title,
            date: sessions.date,
            adventureId: sessions.adventureId,
          })
          .from(sessions)
          .where(inArray(sessions.adventureId, adventureIds))
      : [];

    campaignSessions.forEach((session) => {
      const nodeId = `session-${session.id}`;
      addNode({
        id: nodeId,
        type: "session",
        name: session.title,
        href: `/campaigns/${campaign.id}/sessions/${session.id}`,
        data: { date: session.date },
      });

      if (session.adventureId) {
        addEdge({
          source: `adventure-${session.adventureId}`,
          target: nodeId,
          relation: "hosts",
        });
      }
    });

    const campaignQuests = adventureIds.length
      ? await db
          .select({
            id: quests.id,
            title: quests.title,
            status: quests.status,
            adventureId: quests.adventureId,
          })
          .from(quests)
          .where(inArray(quests.adventureId, adventureIds))
      : [];

    campaignQuests.forEach((quest) => {
      const nodeId = `quest-${quest.id}`;
      addNode({
        id: nodeId,
        type: "quest",
        name: quest.title,
        href: quest.adventureId
          ? `/campaigns/${campaign.id}/adventures/${quest.adventureId}/quests/${quest.id}`
          : undefined,
        data: { status: quest.status },
      });

      if (quest.adventureId) {
        addEdge({
          source: `adventure-${quest.adventureId}`,
          target: nodeId,
          relation: "contains",
        });
      }
    });

    const campaignCharacters = await db
      .select({
        id: characters.id,
        name: characters.name,
        characterType: characters.characterType,
        adventureId: characters.adventureId,
      })
      .from(characters)
      .where(eq(characters.campaignId, campaignId));

    const characterIds = campaignCharacters.map((character) => character.id);

    campaignCharacters.forEach((character) => {
      const nodeId = `character-${character.id}`;
      const nodeType = character.characterType === "npc" ? "npc" : "character";
      addNode({
        id: nodeId,
        type: nodeType,
        name: character.name,
        href: `/campaigns/${campaign.id}/characters/${character.id}`,
        data: { characterType: character.characterType },
      });

      addEdge({
        source: campaignNodeId,
        target: nodeId,
        relation: "features",
      });

      if (character.adventureId) {
        addEdge({
          source: nodeId,
          target: `adventure-${character.adventureId}`,
          relation: "participates_in",
        });
      }
    });

    const campaignLocations = await db
      .select({
        id: locations.id,
        name: locations.name,
        adventureId: locations.adventureId,
      })
      .from(locations)
      .where(eq(locations.campaignId, campaignId));

    campaignLocations.forEach((location) => {
      const nodeId = `location-${location.id}`;
      addNode({
        id: nodeId,
        type: "location",
        name: location.name,
        href: `/campaigns/${campaign.id}/locations/${location.id}`,
      });

      if (location.adventureId) {
        addEdge({
          source: `adventure-${location.adventureId}`,
          target: nodeId,
          relation: "takes_place_in",
        });
      } else {
        addEdge({
          source: campaignNodeId,
          target: nodeId,
          relation: "contains",
        });
      }
    });

    const campaignNpcs = adventureIds.length
      ? await db
          .select({
            id: npcs.id,
            name: npcs.name,
            adventureId: npcs.adventureId,
          })
          .from(npcs)
          .where(inArray(npcs.adventureId, adventureIds))
      : [];

    campaignNpcs.forEach((npc) => {
      const nodeId = `npc-${npc.id}`;
      addNode({
        id: nodeId,
        type: "npc",
        name: npc.name,
        href: npc.adventureId
          ? `/campaigns/${campaign.id}/adventures/${npc.adventureId}`
          : undefined,
      });

      if (npc.adventureId) {
        addEdge({
          source: `adventure-${npc.adventureId}`,
          target: nodeId,
          relation: "introduces",
        });
      }
    });

    const characterItemAssignments = characterIds.length
      ? await db
          .select({
            characterId: magicItemAssignments.entityId,
            magicItemId: magicItems.id,
            magicItemName: magicItems.name,
          })
          .from(magicItemAssignments)
          .innerJoin(
            magicItems,
            eq(magicItemAssignments.magicItemId, magicItems.id),
          )
          .where(
            and(
              eq(magicItemAssignments.entityType, "character"),
              inArray(magicItemAssignments.entityId, characterIds),
            ),
          )
      : [];

    // Also get magic items assigned to locations in this campaign
    const locationItemAssignments = campaignLocations.length
      ? await db
          .select({
            locationId: magicItemAssignments.entityId,
            magicItemId: magicItems.id,
            magicItemName: magicItems.name,
          })
          .from(magicItemAssignments)
          .innerJoin(
            magicItems,
            eq(magicItemAssignments.magicItemId, magicItems.id),
          )
          .where(
            and(
              eq(magicItemAssignments.entityType, "location"),
              inArray(magicItemAssignments.entityId, campaignLocations.map(l => l.id)),
            ),
          )
      : [];

    // Combine all magic item assignments
    const allItemAssignments = [
      ...characterItemAssignments.map(item => ({ ...item, entityType: 'character' as const, entityId: item.characterId })),
      ...locationItemAssignments.map(item => ({ ...item, entityType: 'location' as const, entityId: item.locationId })),
    ];

    // Create a set of unique magic item IDs to avoid duplicates
    const uniqueMagicItemIds = new Set(allItemAssignments.map(item => item.magicItemId));

    uniqueMagicItemIds.forEach((magicItemId) => {
      const assignments = allItemAssignments.filter(item => item.magicItemId === magicItemId);
      const firstAssignment = assignments[0];

      const nodeId = `magicItem-${magicItemId}`;
      addNode({
        id: nodeId,
        type: "magicItem",
        name: firstAssignment.magicItemName,
        href: `/magic-items/${magicItemId}`,
      });

      // Create edges for all assignments
      assignments.forEach((assignment) => {
        const sourceId = `${assignment.entityType}-${assignment.entityId}`;
        if (nodeMap.has(sourceId)) {
          addEdge({
            source: sourceId,
            target: nodeId,
            relation: "owns",
          });
        }
      });
    });

    // Add relationships if includeRelationships is true
    if (includeRelationships) {
      const campaignRelations = await db
        .select()
        .from(relations)
        .where(eq(relations.campaignId, campaignId));

      campaignRelations.forEach((relation) => {
        const sourceNodeId = `${relation.sourceEntityType}-${relation.sourceEntityId}`;
        const targetNodeId = `${relation.targetEntityType}-${relation.targetEntityId}`;

        // Only add edges if both nodes exist in our graph
        if (nodeMap.has(sourceNodeId) && nodeMap.has(targetNodeId)) {
          addEdge({
            source: sourceNodeId,
            target: targetNodeId,
            relation: relation.relationType,
            data: {
              description: relation.description,
              bidirectional: relation.bidirectional,
              isRelationship: true,
            },
          });

          // If bidirectional, add reverse edge
          if (relation.bidirectional) {
            addEdge({
              source: targetNodeId,
              target: sourceNodeId,
              relation: relation.relationType,
              data: {
                description: relation.description,
                bidirectional: true,
                isRelationship: true,
              },
            });
          }
        }
      });
    }

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error("Failed to build campaign network:", error);
    return NextResponse.json(
      { error: "Failed to build campaign network" },
      { status: 500 },
    );
  }
}
