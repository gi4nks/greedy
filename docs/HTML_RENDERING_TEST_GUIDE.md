# HTML Rendering Fix - Test & Verification Guide

## Pre-Deployment Testing

### Test Case 1: Open5e Magic Item Import
**Objective:** Verify HTML rendering for imported magic items

**Steps:**
1. Navigate to `/wiki`
2. Click on the "Search & Import" tab
3. Select a D&D 5e campaign from the dropdown
4. Search for a magic item (e.g., "Ring of Protection")
5. Click on a result to expand it
6. Click "Import" to save it

**Expected Results:**
- [ ] Description displays with proper formatting
- [ ] No raw HTML tags visible (no `<p>`, `<br>`, etc.)
- [ ] Text is readable and well-formatted
- [ ] Tabs and indentation preserved

**What to look for:**
- ✅ Bold text renders as **bold**
- ✅ Lists display as proper list items
- ✅ Paragraphs are separated with spacing
- ✅ Special characters display correctly (°, ™, etc.)

---

### Test Case 2: Open5e Spell Import
**Objective:** Verify complex spell descriptions render correctly

**Steps:**
1. In Wiki tab, search for "Fireball" (or similar spell)
2. Expand the result
3. View the preview
4. Click Import to save it
5. Go to "Imported Articles" tab
6. Expand the imported spell entry

**Expected Results:**
- [ ] Full spell description displays
- [ ] Higher-level spell effects section renders properly
- [ ] Material components are clearly shown
- [ ] No HTML artifacts in output

**Complex Formatting to Verify:**
- [ ] Ability checks (e.g., "Dexterity saving throw")
- [ ] Damage expressions (e.g., "8d6 fire damage")
- [ ] Spell school designation
- [ ] Casting time and duration

---

### Test Case 3: Open5e Monster Import
**Objective:** Verify creature stat block rendering

**Steps:**
1. Search for "dragon" or another monster
2. Expand and review preview
3. Import the monster
4. Check in Imported Articles tab

**Expected Results:**
- [ ] Monster type and size display correctly
- [ ] Armor class shows clearly
- [ ] Hit points are formatted
- [ ] Abilities section renders properly
- [ ] Action descriptions are readable

---

### Test Case 4: Assigned Wiki Content Display
**Objective:** Verify wiki content displays correctly when assigned to entities

**Steps:**
1. Create or open a character
2. Assign an imported spell/item to them
3. View the character detail page
4. Look for "Spells from Wiki Import" or similar section
5. Expand a wiki entity

**Expected Results:**
- [ ] Content displays within the character detail
- [ ] Proper styling matches surrounding content
- [ ] Expandable sections work correctly
- [ ] No formatting issues

---

### Test Case 5: AD&D 2e Backward Compatibility
**Objective:** Ensure AD&D 2e wiki imports still work

**Steps:**
1. Create or select an AD&D 2e campaign
2. Search Wiki for an item/spell
3. Import from Fandom Wiki
4. View in Imported Articles tab

**Expected Results:**
- [ ] AD&D 2e content still renders correctly
- [ ] Wiki markup has been converted to HTML properly
- [ ] Content displays with existing styling
- [ ] No regression from previous behavior

---

### Test Case 6: Mixed Source Display
**Objective:** Verify D&D 5e and AD&D 2e content display together correctly

**Steps:**
1. Have both D&D 5e and AD&D 2e campaigns set up
2. Import items from both sources
3. Compare styling and formatting in Imported Articles

**Expected Results:**
- [ ] Both sources render cleanly
- [ ] Styling is consistent
- [ ] No conflicts between renderers
- [ ] Each source is labeled correctly

---

## Automated Verification

### TypeScript Checks
```bash
npx tsc --noEmit
```
**Expected:** 0 errors

### Build Verification
```bash
npm run build
```
**Expected:** Compilation successful, 0 errors

### Component Imports
Verify imports are correct:
```typescript
import { isHTML, detectContentFormat } from "@/lib/utils/content-format";
```

---

## Visual Inspection Checklist

### In Browser Console
Look for any errors related to:
- [ ] DOMPurify sanitization
- [ ] HTML parsing
- [ ] Markdown rendering
- [ ] Format detection

### CSS Classes Applied
Verify these CSS classes are present:
- [ ] `prose` - Main prose styling
- [ ] `max-w-none` - Full width content
- [ ] `dark:prose-invert` - Dark mode support
- [ ] Custom className from props (e.g., `prose-sm`)

### Content Safety
Verify no potentially dangerous content:
- [ ] No `<script>` tags rendered
- [ ] No `onclick` handlers visible in HTML
- [ ] No form elements or inputs
- [ ] No external image loads (except from trusted sources)

---

## Performance Checks

### Initial Load
- [ ] No noticeable delay when expanding content
- [ ] Format detection is instant
- [ ] Sanitization completes quickly

### Memory Usage
- [ ] No memory leaks when expanding/collapsing
- [ ] No duplicate renders
- [ ] Proper cleanup on unmount

---

## Edge Cases to Test

### Empty or Null Content
```typescript
// Should handle gracefully
<WikiContent content={null} importedFrom="open5e-api" />
<WikiContent content="" importedFrom="open5e-api" />
<WikiContent content={undefined} importedFrom="open5e-api" />
```
**Expected:** Renders empty or placeholder gracefully

### Mixed Markup
```
Content with **markdown** and <html> and plain text
```
**Expected:** Detected as HTML, sanitized and rendered

### Very Long Content
**Expected:** 
- [ ] Renders without truncation
- [ ] Scrollable within container
- [ ] No layout shifts
- [ ] Proper text wrapping

### Special Characters
**Expected:**
- [ ] Unicode characters render correctly
- [ ] Diacritics preserved (é, ñ, etc.)
- [ ] Damage notation (e.g., "d20") displays correctly
- [ ] Mathematical symbols render

---

## Deployment Verification

### Before Going Live
- [ ] All tests pass
- [ ] Build succeeds with no warnings
- [ ] No TypeScript errors
- [ ] Functionality tested in staging
- [ ] Performance acceptable

### Post-Deployment Monitoring
- [ ] Check for JavaScript errors in production
- [ ] Monitor user feedback for rendering issues
- [ ] Verify import/search still works
- [ ] Check performance metrics
- [ ] No unusual console warnings

---

## Rollback Plan

If issues are detected:

1. **Revert Changes:**
   ```bash
   git revert <commit-hash>
   npm install
   npm run build
   ```

2. **Quick Fix:**
   - Update `detectContentFormat` logic if detection fails
   - Adjust regex patterns if false positives occur

3. **Report Issues:**
   - Document specific failing cases
   - Check Open5e API response format
   - Verify content in database is stored correctly

---

## Success Criteria

✅ **All tests pass** - No unexpected behavior
✅ **Backward compatible** - AD&D 2e and 5e.tools still work
✅ **No errors** - Console clean, no TypeScript errors
✅ **Performance** - Same or better than before
✅ **User experience** - Content displays clearly and beautifully
