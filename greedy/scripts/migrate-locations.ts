#!/usr/bin/env tsx
/**
 * Data migration script to populate campaignId for existing locations
 */

import { db } from "@/lib/db";
import { locations, adventures } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";

async function migrateLocationCampaignIds() {
  console.log("🔄 Migrating location campaign IDs...");

  try {
    // Get all locations that have adventureId but no campaignId
    const locationsToMigrate = await db
      .select({
        id: locations.id,
        adventureId: locations.adventureId,
        campaignId: locations.campaignId,
      })
      .from(locations)
      .leftJoin(adventures, eq(locations.adventureId, adventures.id))
      .where(isNull(locations.campaignId));

    console.log(`Found ${locationsToMigrate.length} locations to migrate`);

    for (const location of locationsToMigrate) {
      if (location.adventureId) {
        // Get the campaignId from the adventure
        const adventure = await db
          .select({ campaignId: adventures.campaignId })
          .from(adventures)
          .where(eq(adventures.id, location.adventureId))
          .limit(1);

        if (adventure[0]?.campaignId) {
          await db
            .update(locations)
            .set({ campaignId: adventure[0].campaignId })
            .where(eq(locations.id, location.id));

          console.log(
            `✅ Updated location ${location.id} with campaignId ${adventure[0].campaignId}`,
          );
        } else {
          console.log(
            `⚠️  Location ${location.id} has adventure ${location.adventureId} but adventure has no campaignId`,
          );
        }
      } else {
        console.log(
          `⚠️  Location ${location.id} has no adventureId - cannot determine campaignId`,
        );
      }
    }

    // Check for any locations that still have null campaignId
    const remainingNullCampaignIds = await db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .where(isNull(locations.campaignId));

    if (remainingNullCampaignIds.length > 0) {
      console.log(
        `⚠️  ${remainingNullCampaignIds.length} locations still have null campaignId:`,
      );
      remainingNullCampaignIds.forEach((loc) => {
        console.log(`   - Location ${loc.id}: ${loc.name}`);
      });
    } else {
      console.log("✅ All locations now have campaignId set");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateLocationCampaignIds()
    .then(() => {
      console.log("🎉 Migration complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateLocationCampaignIds };
