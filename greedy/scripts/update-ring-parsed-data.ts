import { WikiDataService } from "../lib/services/wiki-data";
import Database from "better-sqlite3";
import path from "path";

interface WikiArticleRow {
  id: number;
  title: string;
  content_type: string;
  wiki_url: string;
  raw_content: string | null;
  parsed_data: string;
  imported_from: string;
  created_at: string;
  updated_at: string;
}

async function updateRingOfInvisibility() {
  const dbPath = path.join(process.cwd(), "campaign.db");
  const db = new Database(dbPath);

  try {
    // Get the existing article
    const article = db
      .prepare("SELECT * FROM wiki_articles WHERE title = ?")
      .get("Ring of Invisibility (Magic Ring)") as WikiArticleRow | undefined;

    if (!article) {
      console.log("Ring of Invisibility article not found");
      return;
    }

    console.log("Found article:", article.title);
    console.log("Current parsed_data:", article.parsed_data);

    // Create a WikiArticle object for the API call
    const wikiArticle = {
      id: article.id,
      title: article.title,
      url: article.wiki_url,
    };

    // Fetch full content from wiki
    console.log("Fetching full content from wiki...");
    const response = await fetch(
      `http://localhost:3000/api/wiki/article/0?title=${encodeURIComponent(article.title)}&full=true`,
    );

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`,
      );
    }

    const fullContent = await response.json();

    if (fullContent.content) {
      console.log("Got content, parsing...");

      // Parse the magic item data
      const parsedData = WikiDataService.parseMagicItemData(
        fullContent.content,
      );

      console.log("Parsed data:", parsedData);

      // Update the database
      const updateStmt = db.prepare(`
        UPDATE wiki_articles
        SET raw_content = ?, parsed_data = ?
        WHERE id = ?
      `);

      updateStmt.run(
        fullContent.content,
        JSON.stringify(parsedData),
        article.id,
      );

      console.log("Successfully updated Ring of Invisibility with parsed data");
    } else {
      console.log("No content received from wiki");
    }
  } catch (error) {
    console.error("Error updating Ring of Invisibility:", error);
  } finally {
    db.close();
  }
}

updateRingOfInvisibility().catch(console.error);
