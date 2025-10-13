#!/usr/bin/env node
import { db } from "../lib/db/index.js";
import { campaigns, gameEditions } from "../lib/db/schema.js";
import { eq } from "drizzle-orm";

async function testCampaigns() {
  try {
    console.log("Testing campaigns query...");

    // Test the exact same query as getCampaigns
    const result = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        description: campaigns.description,
        status: campaigns.status,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        tags: campaigns.tags,
        gameEditionId: campaigns.gameEditionId,
        gameEditionName: gameEditions.name,
        gameEditionVersion: gameEditions.version,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
      })
      .from(campaigns)
      .leftJoin(gameEditions, eq(campaigns.gameEditionId, gameEditions.id))
      .orderBy(campaigns.createdAt);

    console.log("Query result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error testing campaigns:", error);
  }
}

testCampaigns();
