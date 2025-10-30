# Breadcrumb Mismatch Diagnosis & Fix

## Problem Summary
- **Prod (session 8)**: Breadcrumb shows `Campaigns > L'ascesa del faraone > Adventures > Tomb of Martek > Sessions > The Pirates's boat`
- **Dev (session 9)**: Breadcrumb shows `Campaigns > Desert of Desolation > Sessions > Test Session`
- **Root cause**: Database content differs between environments (campaign titles & adventure links)

## Diagnosis Results

| Aspect | Prod | Dev |
|--------|------|-----|
| Campaign 1 Title | "L'ascesa del faraone" | "Desert of Desolation" |
| Session Title | "The Pirates's boat" | "Test Session" |
| Adventure Link | "Tomb of Martek" (ID: ?) | *(none)* |

## Solution

To align **prod → dev** (keep dev as source of truth):

### Step 1: Backup
```bash
ssh your-prod-server
cd /path/to/greedy
cp database/campaign.db database/campaign.db.backup.$(date +%s)
```

### Step 2: Apply SQL
```bash
sqlite3 database/campaign.db << 'EOF'
UPDATE campaigns 
SET title = 'Desert of Desolation',
    updated_at = datetime('now')
WHERE id = 1;

-- Verify
SELECT id, title FROM campaigns WHERE id = 1;
EOF
```

### Step 3: Restart App
```bash
npm run build && npm run start
# OR redeploy via your deployment process
```

### Step 4: Verify
Navigate to prod: `http://greedy.local:3002/campaigns/1/sessions/8`
- Breadcrumb should now show: `Campaigns > Desert of Desolation > Sessions > The Pirates's boat`

## Optional: Unlink Adventure from Prod Session 8
If you also want session 8 (prod) to have no adventure link (matching session 9 in dev):
```sql
UPDATE sessions SET adventure_id = NULL WHERE id = 8;
```

## Tools Provided

### `scripts/diagnose-breadcrumb-sync.mjs`
Diagnostic script for comparing dev/prod data.

**Usage:**
```bash
# Show dev data and diagnosis
node scripts/diagnose-breadcrumb-sync.mjs

# Generate remediation SQL
node scripts/diagnose-breadcrumb-sync.mjs --sync-to-prod
```

### `scripts/fix-prod-breadcrumb.sql`
Pre-written SQL for prod database fix. See file for detailed instructions.

## Prevention for Future

1. **Ensure data parity**: After deploying new app versions, verify test data is consistent across environments.
2. **Document test campaigns**: Keep a record of campaign/session names used for testing in each environment.
3. **Consider seed data**: If test data should be identical, use a seed/fixture file that's applied to both environments.
4. **Cache invalidation**: After data changes, ensure `revalidatePath()` is called (already in your update actions).

## Questions?

If breadcrumbs show different values again after applying this fix:
1. Run the diagnostic script on both prod and dev
2. Check if new data was added that isn't synced
3. Verify the app was rebuilt/redeployed after DB changes
