import { db } from '@/lib/db';
import { wikiArticles, wikiArticleEntities, magicItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function migrateWikiData() {
  console.log('Wiki data migration already completed. Old tables have been removed.');
  console.log('The unified wiki system is now in place.');
  return;
}

// Run the migration
migrateWikiData().catch(console.error);