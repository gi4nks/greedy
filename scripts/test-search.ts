import { SearchService } from "../src/lib/services/search";

async function testSearch() {
  console.log("Testing search service...");

  try {
    // Test search for a common term
    const results = await SearchService.search("test", {}, 10);

    console.log(`Found ${results.length} results`);

    // Check that entities with campaigns have campaignId populated
    const campaignEntities = results.filter(r =>
      ["session", "character", "npc", "location", "quest"].includes(r.entityType)
    );

    console.log(`Found ${campaignEntities.length} campaign-related entities`);

    for (const result of campaignEntities.slice(0, 5)) {
      console.log(`${result.entityType}: ${result.title} - campaignId: ${result.campaignId || 'undefined'}`);
    }

    // Check URL generation would work
    const urlResults = results.filter(r => r.campaignId).slice(0, 3);
    for (const result of urlResults) {
      const expectedUrl = `/campaigns/${result.campaignId}/${result.entityType}s/${result.id}`;
      console.log(`✓ ${result.entityType} URL: ${expectedUrl}`);
    }

    // Test broader search
    console.log("\n--- Broader search test ---");
    const allResults = await SearchService.search("", {}, 50);
    console.log(`Total results: ${allResults.length}`);

    const byType = allResults.reduce((acc: Record<string, number>, r) => {
      acc[r.entityType] = (acc[r.entityType] || 0) + 1;
      return acc;
    }, {});
    console.log("Results by type:", byType);

    const withCampaignId = allResults.filter(r => r.campaignId);
    console.log(`Entities with campaignId: ${withCampaignId.length}`);

    console.log("Search test completed successfully!");

  } catch (error) {
    console.error("Search test failed:", error);
  }
}

testSearch();