/**
 * PROD DATABASE REMEDIATION
 * 
 * File: scripts/fix-prod-breadcrumb.sql
 * 
 * This script aligns prod campaign data with dev to fix breadcrumb mismatch.
 * 
 * BEFORE RUNNING:
 * 1. SSH into your prod server
 * 2. Backup the database:
 *    cp database/campaign.db database/campaign.db.backup.$(date +%s)
 * 3. Connect to SQLite:
 *    sqlite3 database/campaign.db
 * 4. Paste the commands below
 * 5. Verify with: SELECT id, title FROM campaigns WHERE id = 1;
 * 6. Exit SQLite: .quit
 * 7. Restart the app or redeploy
 * 
 * SUMMARY OF CHANGES:
 * - Campaign 1 title: "L'ascesa del faraone" → "Desert of Desolation"
 * 
 * RESULT:
 * - Prod breadcrumb will now show: Campaigns > Desert of Desolation > Sessions > ...
 * - This matches dev environment
 */

-- ============================================================
-- FIX PROD BREADCRUMB MISMATCH
-- ============================================================

-- Update Campaign 1 title to match dev
UPDATE campaigns 
SET title = 'Desert of Desolation',
    updated_at = datetime('now')
WHERE id = 1;

-- Verify the change
-- SELECT id, title, updated_at FROM campaigns WHERE id = 1;

-- ============================================================
-- OPTIONAL: If you also want to unlink the adventure from 
-- prod session 8 to match dev session 9 (no adventure):
-- Uncomment the line below ONLY if session 8 should have no adventure
-- ============================================================

-- UPDATE sessions SET adventure_id = NULL WHERE id = 8;

-- ============================================================
-- After applying changes:
-- 1. Exit SQLite (.quit)
-- 2. Restart the application:
--    npm run build && npm run start
--    OR redeploy via your deployment process
-- 3. Navigate to prod URL and verify breadcrumb shows:
--    Campaigns > Desert of Desolation > Sessions > The Pirates's boat
-- ============================================================
