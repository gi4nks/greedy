import fetch from "node-fetch";

async function testAPI() {
  try {
    const response = await fetch("http://localhost:3000/api/characters/2");
    const data = await response.json();

    console.log("API Response Status:", response.status);
    console.log("Character Name:", data.name);
    console.log("Wiki Spells:", data.wikiSpells);
    console.log("Wiki Monsters:", data.wikiMonsters);

    if (data.wikiSpells && data.wikiSpells.length > 0) {
      console.log("First spell:", JSON.stringify(data.wikiSpells[0], null, 2));
    }

    if (data.wikiMonsters && data.wikiMonsters.length > 0) {
      console.log(
        "First monster:",
        JSON.stringify(data.wikiMonsters[0], null, 2),
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testAPI();
