# Unused Code Analysis Report

## Executive Summary

Analysis completed on the React/Next.js codebase identified **16 unused files** and **269 unused exports**. The analysis now correctly considers all Next.js pages and layouts as entry points, providing accurate results.

**Cleanup Completed:** Successfully removed 6 truly unused files and 1 old migration file. Build passes without errors.

## Key Findings

### Files Removed ✅
These files were safely removed during cleanup:

1. **Components:**
   - `src/components/campaign/CreateCampaignForm.tsx`
   - `src/components/character/CharacterActions.tsx`
   - `src/components/character/CharacterFilters.tsx`
   - `src/components/character/CharacterList.tsx`
   - `src/components/ui/avatar.tsx`

2. **Utilities & Services:**
   - `src/lib/db/migrations/010_add_session_images.ts` (old migration)
   - `src/lib/utils/handleActionResult.ts`

### Remaining Unused Files (9)
These files are still marked as unused but require further investigation:

1. **Components:**
   - `src/components/Navigation.tsx` *(Actually used in layout.tsx - script bug)*
   - `src/components/campaign/CampaignNetwork.tsx` *(Confirmed unused)*

2. **Utilities & Services:**
   - `src/lib/services/edition-aware-import.ts`
   - `src/lib/utils/imageUtils.ts`
   - `src/lib/utils/index.ts`
   - `src/lib/utils/magicItems.ts`
   - `src/lib/utils/wiki-categories.ts`
   - `src/lib/utils/wiki.ts`
   - `src/lib/validation/schemas.ts`

### Unused Exports (257)
These include:
- **Page exports** (expected - pages are accessed via routing)
- **UI component exports** (may be used indirectly through component libraries)
- **Type definitions** (may be used for TypeScript inference)
- **Utility functions** (may be used dynamically)

## Recommendations

### High Priority (Safe to Remove)
1. **CampaignNetwork.tsx** - Confirmed unused, can be safely removed
2. **Remaining utility files** - Review and remove if truly unused

### Medium Priority (Review Carefully)
1. **UI components** - Some may be used indirectly through design systems
2. **Type exports** - May be needed for TypeScript compilation
3. **Service exports** - May be used for future features

### Low Priority (Keep)
1. **Page default exports** - Required for Next.js routing
2. **Library exports** - May be used indirectly

## Removal Process

1. **Backup first** - Create a git branch for safe removal
2. **Remove unused files** - Start with the clearly unused components
3. **Test thoroughly** - Run build, tests, and manual testing
4. **Remove unused exports** - Clean up remaining dead code
5. **Update imports** - Fix any broken imports after removal

## Automation

The analysis script is available at `scripts/analyze-unused.js` and can be run with:
```bash
node scripts/analyze-unused.js
```

Or via npm script:
```bash
npm run analyze-unused
```

## Next Steps

1. **Fix analysis script** - Address import resolution bugs (Navigation component detection)
2. **Review remaining files** - Verify which additional files can be safely removed
3. **Remove unused exports** - Clean up remaining dead code
4. **Consider adding this analysis to CI/CD pipeline** for ongoing monitoring
5. **Review component architecture** to prevent future unused code accumulation

---

*Report generated on: $(date)*
*Analysis script: scripts/analyze-unused.js*
*Cleanup completed: 7 files removed, build successful*</content>
<parameter name="filePath">/Users/gianluca/Projects/github/gi4nks/greedy/UNUSED_CODE_REPORT.md