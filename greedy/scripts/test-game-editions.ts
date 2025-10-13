#!/usr/bin/env tsx

import { db } from "../lib/db";
import { gameEditions } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function testGameEditions() {
  console.log("Testing game editions query...");

  try {
    // Test 1: Select all records without filter
    console.log("\n1. All game editions:");
    const allEditions = await db.select().from(gameEditions);
    console.log("Count:", allEditions.length);
    allEditions.forEach((edition) => {
      console.log(
        `  - ${edition.id}: ${edition.name} (active: ${edition.isActive})`,
      );
    });

    // Test 2: Select with isActive = true
    console.log("\n2. Active game editions (isActive = true):");
    const activeEditions = await db
      .select()
      .from(gameEditions)
      .where(eq(gameEditions.isActive, true));
    console.log("Count:", activeEditions.length);
    activeEditions.forEach((edition) => {
      console.log(
        `  - ${edition.id}: ${edition.name} (active: ${edition.isActive})`,
      );
    });

    // Test 3: Raw SQL query
    console.log("\n3. Raw SQL query:");
    const rawResult = await db.all(
      "SELECT * FROM game_editions WHERE is_active = 1",
    );
    console.log("Count:", rawResult.length);
    console.log("Raw result:", rawResult);
  } catch (error) {
    console.error("Error testing game editions:", error);
  }
}

testGameEditions();
