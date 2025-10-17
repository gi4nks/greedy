import { DnD5eToolsService } from "../src/lib/services/dnd5e-tools";

async function test5eToolsIntegration() {
  console.log("Testing 5e.tools integration...");

  // Set the base URL for server-side testing
  const originalFetch = global.fetch;
  global.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      return originalFetch(`http://localhost:3000${input}`, init);
    }
    return originalFetch(input, init);
  };

  try {
    // Test races (should work)
    console.log("\nTesting races...");
    const races = await DnD5eToolsService.searchRaces("human");
    console.log(`Found ${races.length} races matching "human"`);
    if (races.length > 0) {
      console.log(`First race: ${races[0].name}`);
    }

    // Test spells (should work)
    console.log("\nTesting spells...");
    const spells = await DnD5eToolsService.searchSpells("fire");
    console.log(`Found ${spells.length} spells matching "fire"`);
    if (spells.length > 0) {
      console.log(`First spell: ${spells[0].name}`);
    }

    // Test monsters (should work)
    console.log("\nTesting monsters...");
    const monsters = await DnD5eToolsService.searchMonsters("goblin");
    console.log(`Found ${monsters.length} monsters matching "goblin"`);
    if (monsters.length > 0) {
      console.log(`First monster: ${monsters[0].name}`);
    }

    // Test magic items (may not work)
    console.log("\nTesting magic items...");
    const items = await DnD5eToolsService.searchMagicItems("sword");
    console.log(`Found ${items.length} magic items matching "sword"`);
    if (items.length > 0) {
      console.log(`First item: ${items[0].name}`);
    }

    // Test classes (may not work)
    console.log("\nTesting classes...");
    const classes = await DnD5eToolsService.searchClasses("wizard");
    console.log(`Found ${classes.length} classes matching "wizard"`);
    if (classes.length > 0) {
      console.log(`First class: ${classes[0].name}`);
    }

    console.log("\n5e.tools integration test completed!");
  } catch (error) {
    console.error("Error testing 5e.tools integration:", error);
  } finally {
    global.fetch = originalFetch;
  }
}

test5eToolsIntegration();