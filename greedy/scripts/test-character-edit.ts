#!/usr/bin/env tsx

import { db } from "../lib/db";
import { characters } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function testCharacterRetrieval() {
  console.log("Testing character data retrieval for editing...");

  try {
    // Get the first character
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, 1))
      .limit(1);

    if (!character) {
      console.log("❌ No character found with ID 1");
      return;
    }

    console.log("✅ Character found:");
    console.log("- ID:", character.id);
    console.log("- Name:", character.name);
    console.log("- Race:", character.race);
    console.log("- Character Type:", character.characterType);
    console.log("- Campaign ID:", character.campaignId);
    console.log("- Adventure ID:", character.adventureId);
    console.log("- Classes JSON:", character.classes);
    console.log("- Description:", character.description);
    console.log("- Strength:", character.strength);

    // Test JSON parsing
    if (character.classes) {
      try {
        const parsedClasses =
          typeof character.classes === "string"
            ? JSON.parse(character.classes)
            : character.classes;
        console.log("✅ Classes parsed successfully:", parsedClasses);
      } catch (error) {
        console.log("❌ Error parsing classes JSON:", error);
      }
    }
  } catch (error) {
    console.error("❌ Error retrieving character:", error);
  }
}

testCharacterRetrieval();
