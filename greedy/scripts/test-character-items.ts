import { db } from "../lib/db/index.js";
import { campaigns, characters } from "../lib/db/schema.js";
import { eq } from "drizzle-orm";

interface TestItem {
  title: string;
  description: string;
}

async function testCharacterItems() {
  console.log("🧪 Testing character items functionality...");

  try {
    // First, create a test campaign
    const [testCampaign] = await db
      .insert(campaigns)
      .values({
        title: "Test Campaign for Items",
        description: "A test campaign to verify items functionality",
      })
      .returning();

    console.log("✅ Test campaign created:", testCampaign.title);

    // Test creating a character with items
    const testItems = [
      {
        title: "Sword of Destiny",
        description: "A legendary sword with magical properties",
      },
      { title: "Potion of Healing", description: "Restores 2d4+2 hit points" },
    ];

    const [testCharacter] = await db
      .insert(characters)
      .values({
        campaignId: testCampaign.id,
        name: "Test Character with Items",
        race: "Human",
        level: 3,
        characterType: "pc",
        items: JSON.stringify(testItems),
      })
      .returning();

    console.log("✅ Test character with items created:", testCharacter.name);

    // Query the character back and verify items
    const [retrievedCharacter] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, testCharacter.id));

    console.log("✅ Character retrieved from database");

    // Parse and verify items
    const parsedItems = JSON.parse(String(retrievedCharacter.items || "[]"));
    console.log("✅ Items parsed successfully:", parsedItems.length, "items");

    parsedItems.forEach((item: TestItem, index: number) => {
      console.log(
        `   - Item ${index + 1}: ${item.title} - ${item.description}`,
      );
    });

    // Verify the items match what we inserted
    if (
      parsedItems.length === 2 &&
      parsedItems[0].title === "Sword of Destiny" &&
      parsedItems[1].title === "Potion of Healing"
    ) {
      console.log("✅ Items data integrity verified");
    } else {
      throw new Error("Items data does not match expected values");
    }

    // Clean up
    await db.delete(characters).where(eq(characters.id, testCharacter.id));
    await db.delete(campaigns).where(eq(campaigns.id, testCampaign.id));

    console.log("✅ Test data cleaned up");
    console.log("🎉 Character items functionality test PASSED!");
  } catch (error) {
    console.error("❌ Character items test FAILED:", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testCharacterItems().catch(console.error);
}
