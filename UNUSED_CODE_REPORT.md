# Unused Code Analysis Report

## Executive Summary

Analysis completed on the React/Next.js codebase identified **16 unused files** and **269 unused exports**. The analysis now correctly considers all Next.js pages and layouts as entry points, providing accurate results.

## Key Findings

### Unused Files (16)
These files are not imported or referenced anywhere in the codebase and can be safely removed:

1. **Components:**
   - `src/components/Navigation.tsx`
   - `src/components/campaign/CampaignNetwork.tsx`
   - `src/components/campaign/CreateCampaignForm.tsx`
   - `src/components/character/CharacterActions.tsx`
   - `src/components/character/CharacterFilters.tsx`
   - `src/components/character/CharacterList.tsx`
   - `src/components/ui/avatar.tsx`

2. **Utilities & Services:**
   - `src/lib/db/migrations/010_add_session_images.ts`
   - `src/lib/services/edition-aware-import.ts`
   - `src/lib/utils/handleActionResult.ts`
   - `src/lib/utils/imageUtils.ts`
   - `src/lib/utils/index.ts`
   - `src/lib/utils/magicItems.ts`
   - `src/lib/utils/wiki-categories.ts`
   - `src/lib/utils/wiki.ts`
   - `src/lib/validation/schemas.ts`

### Unused Exports (269)
These include:
- **Page exports** (expected - pages are accessed via routing)
- **UI component exports** (may be used indirectly through component libraries)
- **Type definitions** (may be used for TypeScript inference)
- **Utility functions** (may be used dynamically)

## Recommendations

### High Priority (Safe to Remove)
1. **Unused component files** - Delete these 7 component files
2. **Migration file** - `010_add_session_images.ts` appears to be an old migration
3. **Utility files** - Review and remove unused utility functions

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

1. Review the unused files list and confirm they're truly unused
2. Remove files in small batches, testing after each removal
3. Consider adding this analysis to CI/CD pipeline for ongoing monitoring
4. Review component architecture to prevent future unused code accumulation

---

*Report generated on: $(date)*
*Analysis script: scripts/analyze-unused.js*</content>
<parameter name="filePath">/Users/gianluca/Projects/github/gi4nks/greedy/UNUSED_CODE_REPORT.md