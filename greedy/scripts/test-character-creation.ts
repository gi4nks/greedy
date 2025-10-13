import { db } from "../lib/db/index.js";
import { campaigns, characters } from "../lib/db/schema.js";
import { eq } from "drizzle-orm";

async function testCharacterCreation() {
  console.log("🧪 Testing character creation functionality...");

  try {
    // First, create a test campaign
    const [testCampaign] = await db
      .insert(campaigns)
      .values({
        title: "Test Campaign for Characters",
        description: "A test campaign to verify character creation",
      })
      .returning();

    console.log("✅ Test campaign created:", testCampaign.title);

    // Now test creating a character
    const [testCharacter] = await db
      .insert(characters)
      .values({
        campaignId: testCampaign.id,
        name: "Test Character",
        race: "Human",
        level: 1,
        characterType: "pc",
      })
      .returning();

    console.log("✅ Test character created:", testCharacter.name);

    // Test creating an NPC
    const [testNpc] = await db
      .insert(characters)
      .values({
        campaignId: testCampaign.id,
        name: "Test NPC",
        race: "Elf",
        level: 5,
        characterType: "npc",
      })
      .returning();

    console.log("✅ Test NPC created:", testNpc.name);

    // Query characters for the campaign
    const campaignCharacters = await db
      .select()
      .from(characters)
      .where(eq(characters.campaignId, testCampaign.id));

    console.log("✅ Characters in campaign:", campaignCharacters.length);
    campaignCharacters.forEach((char) => {
      console.log(
        `   - ${char.name} (${char.characterType}): ${char.race} Level ${char.level}`,
      );
    });

    // Clean up
    await db
      .delete(characters)
      .where(eq(characters.campaignId, testCampaign.id));
    await db.delete(campaigns).where(eq(campaigns.id, testCampaign.id));

    console.log("✅ Test data cleaned up");
    console.log("🎉 Character creation functionality test PASSED!");
  } catch (error) {
    console.error("❌ Character creation test FAILED:", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testCharacterCreation().catch(console.error);
}
