/**
 * Diagnostic & Sync Script for Campaign/Session/Adventure Data
 * 
 * Compares dev DB data with what should be in prod, and generates
 * remediation SQL if needed.
 * 
 * Usage:
 *   node scripts/diagnose-breadcrumb-sync.mjs [--sync-to-prod]
 * 
 * Options:
 *   --sync-to-prod   Generate SQL that you should run on prod DB
 *   (default)        Just show diagnostic info
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database/campaign.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

const args = process.argv.slice(2);
const shouldSyncToProd = args.includes('--sync-to-prod');

console.log('═══════════════════════════════════════════════════════════════');
console.log('DEV DATABASE DIAGNOSTIC & SYNC SCRIPT');
console.log('═══════════════════════════════════════════════════════════════\n');

try {
  // 1. Get campaign 1 details
  console.log('📋 CAMPAIGN DATA (ID: 1)\n');
  const campaign = db.prepare('SELECT id, title, description FROM campaigns WHERE id = 1').get();
  if (campaign) {
    console.log(`  ID:    ${campaign.id}`);
    console.log(`  Title: "${campaign.title}"`);
    console.log(`  Desc:  ${campaign.description ? `"${campaign.description.substring(0, 50)}..."` : '(none)'}`);
  } else {
    console.log('  ⚠️  Campaign 1 NOT FOUND in dev DB!');
  }
  console.log();

  // 2. Get session 9 (dev) details
  console.log('📋 SESSION DATA (DEV: ID 9)\n');
  const sessionDev = db.prepare(`
    SELECT 
      s.id, s.title, s.date, s.campaign_id, s.adventure_id,
      s.text, LENGTH(s.images) as images_size, s.created_at, s.updated_at
    FROM sessions s
    WHERE s.id = 9
  `).get();
  if (sessionDev) {
    console.log(`  ID:           ${sessionDev.id}`);
    console.log(`  Title:        "${sessionDev.title}"`);
    console.log(`  Campaign ID:  ${sessionDev.campaign_id}`);
    console.log(`  Adventure ID: ${sessionDev.adventure_id !== null ? sessionDev.adventure_id : '(none)'}`);
    console.log(`  Date:         ${sessionDev.date}`);
    console.log(`  Text size:    ${sessionDev.text ? `${sessionDev.text.length} chars` : '(none)'}`);
    console.log(`  Images size:  ${sessionDev.images_size} bytes`);
    console.log(`  Updated:      ${sessionDev.updated_at}`);
  } else {
    console.log('  ⚠️  Session 9 NOT FOUND in dev DB!');
  }
  console.log();

  // 3. Get adventure if linked
  if (sessionDev?.adventure_id) {
    console.log(`📋 ADVENTURE DATA (ID: ${sessionDev.adventure_id})\n`);
    const adventure = db.prepare(`
      SELECT id, title, campaign_id, description FROM adventures WHERE id = ?
    `).get(sessionDev.adventure_id);
    if (adventure) {
      console.log(`  ID:          ${adventure.id}`);
      console.log(`  Title:       "${adventure.title}"`);
      console.log(`  Campaign ID: ${adventure.campaign_id}`);
      console.log(`  Desc:        ${adventure.description ? `"${adventure.description.substring(0, 50)}..."` : '(none)'}`);
    } else {
      console.log(`  ⚠️  Adventure ${sessionDev.adventure_id} NOT FOUND!`);
    }
    console.log();
  }

  // 4. Show what breadcrumb SHOULD show (dev)
  console.log('🎫 EXPECTED BREADCRUMB (DEV SESSION 9):\n');
  const breadcrumbParts = ['Campaigns'];
  if (campaign) breadcrumbParts.push(campaign.title);
  if (sessionDev?.adventure_id) {
    const adv = db.prepare('SELECT title FROM adventures WHERE id = ?').get(sessionDev.adventure_id);
    if (adv) breadcrumbParts.push(adv.title);
  }
  breadcrumbParts.push('Sessions');
  if (sessionDev) breadcrumbParts.push(sessionDev.title);
  console.log(`  ${breadcrumbParts.join(' > ')}\n`);

  // 5. Show production breadcrumb observation for comparison
  console.log('🎫 OBSERVED BREADCRUMB (PROD SESSION 8):\n');
  console.log(`  Campaigns > L'ascesa del faraone > Adventures > Tomb of Martek > Sessions > The Pirates's boat\n`);

  // 6. Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY & DIAGNOSIS\n');

  if (campaign) {
    console.log(`✓ Campaign 1 exists in dev: "${campaign.title}"`);
  } else {
    console.log('✗ Campaign 1 is MISSING in dev DB');
  }

  if (sessionDev) {
    console.log(`✓ Session 9 exists in dev: "${sessionDev.title}"`);
    console.log(`  └─ Linked to campaign ${sessionDev.campaign_id}, adventure ${sessionDev.adventure_id || 'none'}`);
  } else {
    console.log('✗ Session 9 is MISSING in dev DB');
  }

  console.log();
  console.log('LIKELY ISSUES:');
  console.log('  1. Campaign title differs between prod and dev');
  console.log('     Prod shows: "L\'ascesa del faraone"');
  console.log(`     Dev shows:  "${campaign?.title || '(missing)'}"`);
  console.log();
  console.log('  2. Session 9 (dev) may not be linked to an adventure');
  console.log(`     (adventure_id is: ${sessionDev?.adventure_id || 'NULL'})`);
  console.log();
  console.log('  3. Prod session 8 has different data/links than dev session 9');
  console.log('     (Sessions are different test records, not synced)');
  console.log();

  if (shouldSyncToProd) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔧 REMEDIATION SQL FOR PROD\n');
    console.log('Run these on your PROD database to align with dev:\n');

    // Generate idempotent update statements
    if (campaign) {
      console.log(`-- Update campaign 1 title (dev → prod)`);
      console.log(`UPDATE campaigns SET title = '${campaign.title.replace(/'/g, "''")}' WHERE id = 1;\n`);
    }

    if (sessionDev && sessionDev.adventure_id) {
      // Note: This is just example; you'd only do this if session 8 should link to same adventure
      const adv = db.prepare('SELECT title FROM adventures WHERE id = ?').get(sessionDev.adventure_id);
      if (adv) {
        console.log(`-- Note: Session 8 (prod) should link to adventure: "${adv.title}" (ID: ${sessionDev.adventure_id})`);
        console.log(`-- Only do this if prod session 8 should have the same adventure link:`);
        console.log(`-- UPDATE sessions SET adventure_id = ${sessionDev.adventure_id} WHERE id = 8;\n`);
      }
    }

    console.log('⚠️  IMPORTANT:');
    console.log('   • Review each SQL statement carefully before executing on PROD');
    console.log('   • Backup your prod DB first: cp database/campaign.db database/campaign.db.backup');
    console.log('   • After applying, run: npm run build && npm run start (or redeploy)');
    console.log('   • Then navigate to prod URL and verify breadcrumb is correct');
  } else {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💡 NEXT STEPS\n');
    console.log('1. Compare the above dev data with your prod DB manually:');
    console.log('   - Login to prod host');
    console.log('   - Run: sqlite3 /path/to/prod/database/campaign.db');
    console.log('   - Then: SELECT id, title FROM campaigns WHERE id = 1;');
    console.log('   - Then: SELECT id, title, adventure_id FROM sessions WHERE id = 8;');
    console.log();
    console.log('2. If data differs and you want to sync prod → dev:');
    console.log('   - Run this script on prod host');
    console.log('   - Run: node scripts/diagnose-breadcrumb-sync.mjs --sync-to-prod');
    console.log('   - This will generate SQL for prod corrections');
    console.log();
    console.log('3. If you want to generate remediation SQL now:');
    console.log('   - Run: node scripts/diagnose-breadcrumb-sync.mjs --sync-to-prod');
  }

  console.log();
  console.log('═══════════════════════════════════════════════════════════════\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
}
