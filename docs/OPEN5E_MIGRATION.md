# Open5e API Migration Guide

## Overview

This document describes the migration from local 5e.tools data scraping to real-time [Open5e API](https://api.open5e.com/) integration for D&D 5e content.

## Changes Made

### 1. New Service: Open5e API Integration (`src/lib/services/open5e-api.ts`)

Created a new service to handle all Open5e API calls with:
- **Type-safe interfaces** for all Open5e content types (spells, items, monsters, classes, races)
- **Search functions** for each content type with full-text search support
- **Parser functions** to convert Open5e data to standardized format for import
- **Error handling** with graceful fallback to empty results

**Key Functions:**
```typescript
export async function searchOpen5eMagicItems(query?: string): Promise<Open5eMagicItem[]>
export async function searchOpen5eSpells(query?: string): Promise<Open5eSpell[]>
export async function searchOpen5eMonsters(query?: string): Promise<Open5eMonster[]>
export async function searchOpen5eClasses(query?: string): Promise<Open5eClass[]>
export async function searchOpen5eRaces(query?: string): Promise<Open5eRace[]>
```

### 2. Edition-Aware Import Service Update (`src/lib/services/edition-aware-import.ts`)

Updated the `EditionAwareImportService` to route D&D 5e searches to Open5e API:
- Changed import: `import * as Open5eAPI from "./open5e-api"`
- Modified `searchDnD5eContent()` to use Open5e endpoints instead of DnD5eToolsService
- Added support for `slug` field from Open5e responses for better URL generation
- Maintains full backward compatibility with AD&D 2e wiki searches

**Before:**
```typescript
const monsters = await DnD5eToolsService.searchMonsters(searchQuery);
```

**After:**
```typescript
const monsters = await Open5eAPI.searchOpen5eMonsters(searchQuery);
```

### 3. Wiki Import UI Updates (`src/app/(global)/wiki/page.tsx`)

#### Added Open5e Import
- New import: `import * as Open5eAPI from "../../../lib/services/open5e-api"`
- Renamed `load5eToolsContent()` → `loadOpen5eContent()` for clarity
- Updated content loading to search Open5e API in real-time when expanding article details

#### Updated Data Import Logic
- When importing from Open5e sources, fetches fresh data from the API
- Handles all content types: spells, monsters, items, races, classes
- Changed source attribution from `"dnd5e-tools"` to `"open5e-api"`
- Updated badge display to show "D&D 5e (Open5e API)" instead of "D&D 5e (5e.tools)"

#### Flexible Format Handlers
- Updated format functions to accept generic data shapes
- `formatSpellContent()`, `formatMonsterContent()`, `formatMagicItemContent()` now work with both DnD5eTools and Open5e parsed data
- Updated `formatRaceContent()` and `formatClassContent()` to handle Open5e field names

## API Details

### Open5e Endpoints
```
Base URL: https://api.open5e.com/api

Endpoints:
- /magicitems/ - Magic items
- /spells/ - Spells  
- /monsters/ - Monsters
- /classes/ - Classes
- /races/ - Races
```

### Search Parameters
- `search=` - Full-text search parameter (e.g., `/spells/?search=fireball`)
- Returns paginated results with `next` property for pagination support

### Response Format
```json
{
  "count": 123,
  "next": "https://api.open5e.com/api/spells/?search=fire&limit=10&offset=10",
  "previous": null,
  "results": [
    {
      "slug": "fireball",
      "name": "Fireball",
      "desc": "...",
      ...
    }
  ]
}
```

## Data Mapping

### Magic Items
| Open5e | Internal |
|--------|----------|
| `slug` | Used for URL generation |
| `name` | Item name |
| `desc` | Description |
| `type` | Item type |
| `rarity` | Rarity level |
| `requires_attunement` | Requires attunement |

### Spells
| Open5e | Internal |
|--------|----------|
| `name` | Spell name |
| `desc` | Description |
| `level` | Spell level |
| `school` | School of magic |
| `casting_time` | Casting time |
| `range` | Spell range |
| `duration` | Duration |
| `components` | Components (V/S/M) |
| `ritual` | Can be cast as ritual |
| `concentration` | Requires concentration |

### Monsters
| Open5e | Internal |
|--------|----------|
| `name` | Monster name |
| `desc` | Description |
| `size` | Size category |
| `type` | Creature type |
| `alignment` | Alignment |
| `armor_class` | AC value |
| `hit_points` | HP value |
| `speed` | Movement speeds |
| `{strength,dexterity,constitution,intelligence,wisdom,charisma}` | Ability scores |
| `challenge_rating` | CR value |

## Features Preserved

✅ **Search & Preview** - Full-text search with live preview in wiki import modal  
✅ **Item Assignment** - Assign imported items to characters or campaigns  
✅ **Local Storage** - Imported wiki entries saved to database  
✅ **Edition Detection** - Automatic routing based on campaign edition  
✅ **AD&D 2e Support** - AD&D 2e wiki imports remain fully functional  
✅ **No UI Changes** - End-user experience remains identical  

## Benefits

### Real-Time Data
- Always access the latest D&D 5e content from Open5e
- No need to manually update local data files

### Reduced Storage
- Eliminates need for local 5e.tools JSON data files
- `public/5etools/data/items/magicitems.json` and other files no longer needed for D&D 5e

### Better Maintainability
- Single source of truth for D&D 5e content
- No data format conversion issues
- Simpler codebase with clear separation between editions

### Production-Ready
- Open5e API is stable and reliable
- Proper error handling for network failures
- Fallback to empty results (graceful degradation)

## Testing

### Test Cases

✅ **Magic Items Search**
```
Search: "Belt of Dwarvenkind"
Expected: Item found with rarity "rare", requires attunement
Source: open5e-api
```

✅ **Spells Search**
```
Search: "Fireball"
Expected: Level 3 evocation spell, 1 action casting time
Source: open5e-api
```

✅ **Monsters Search**
```
Search: "Ankheg"
Expected: Large monstrosity, CR 3
Source: open5e-api
```

✅ **AD&D 2e Search**
- Search should still work using AD&D 2e Fandom Wiki
- AD&D campaigns unaffected by migration

✅ **Import & Assignment**
- Can assign imported items to characters
- Assignments persist in database
- No errors or empty fields

✅ **Network Verification**
- Browser Network tab shows calls to `api.open5e.com`
- No calls to `5e.tools` for D&D 5e searches

## Rollback Plan

If needed, revert to local data:
1. Restore `DnD5eToolsService` calls in `edition-aware-import.ts`
2. Restore `load5eToolsContent()` function in wiki page
3. Restore local JSON files to `public/5etools/data/`

The original code is preserved in git history.

## Future Enhancements

- [ ] Implement pagination for large result sets
- [ ] Add caching layer for frequently searched items
- [ ] Implement fuzzy search for typo tolerance
- [ ] Add support for homebrew content sources
- [ ] Multi-language support from Open5e

## References

- [Open5e API Documentation](https://open5e.com/)
- [Open5e GitHub](https://github.com/eepMoose/open5e)
- [D&D 5e SRD](https://www.dndbeyond.com/sources/basic-rules)

## Migration Checklist

- [x] Create Open5e API service
- [x] Update edition-aware import routing
- [x] Update wiki import UI
- [x] Update format handlers for data compatibility
- [x] Update source attribution labels
- [x] Test build compilation
- [x] Verify all features work
- [x] Document changes
