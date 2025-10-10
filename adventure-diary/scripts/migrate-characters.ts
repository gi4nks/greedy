import { db } from '../lib/db/index.js';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('Running character table migration...');
  
  try {
    // Check if campaign_id column already exists
    const columns = await db.all(sql`PRAGMA table_info(characters)`);
    const hasCampaignId = columns.some((col: any) => col.name === 'campaign_id');
    
    if (!hasCampaignId) {
      // Add campaignId column to characters table
      await db.run(sql`
        ALTER TABLE characters 
        ADD COLUMN campaign_id INTEGER 
        REFERENCES campaigns(id)
      `);
      
      console.log('✅ Added campaign_id column to characters table');
      
      // Update existing characters to have campaignId based on their adventureId
      await db.run(sql`
        UPDATE characters 
        SET campaign_id = (
          SELECT adventures.campaign_id 
          FROM adventures 
          WHERE adventures.id = characters.adventure_id
        ) 
        WHERE adventure_id IS NOT NULL
      `);
      
      console.log('✅ Updated existing characters with campaign_id');
    } else {
      console.log('✅ campaign_id column already exists, skipping migration');
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration().catch(console.error);
}