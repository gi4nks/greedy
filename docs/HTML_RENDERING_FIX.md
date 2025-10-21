# HTML Rendering Fix for Open5e Wiki Content

## Problem
When importing wiki entries (magic items, spells, monsters, races, classes) from Open5e API for D&D 5e campaigns, the descriptions were being treated as Markdown (used by AD&D 2.0 imports). This caused:

- Raw HTML tags appearing as plain text in the UI
- Improperly formatted content in wiki previews and detail pages
- Inconsistent rendering between AD&D 2e (Fandom Wiki) and D&D 5e (Open5e API) imports

## Solution Overview
Implemented automatic content format detection that:
1. Detects whether content is HTML, Markdown, or plaintext
2. Routes content through the appropriate renderer based on its format
3. Maintains backward compatibility with existing AD&D 2e and 5e.tools imports
4. Sanitizes all HTML through DOMPurify for security

## Files Modified

### 1. Created: `src/lib/utils/content-format.ts`
New utility module with three functions for content format detection:

```typescript
isHTML(content: string | null | undefined): boolean
isMarkdown(content: string | null | undefined): boolean
detectContentFormat(content: string | null | undefined): "html" | "markdown" | "plaintext"
```

**Key Features:**
- Uses regex patterns to detect HTML tags
- Detects Markdown syntax like `*`, `_`, `#`, `[`, `-`, etc.
- Safe handling of null/undefined inputs
- Returns most likely format or defaults to plaintext

### 2. Updated: `src/components/ui/wiki-content.tsx`
Enhanced the WikiContent component to handle multiple content sources:

**Changes:**
- Added import for content format detection utility
- Added special handling for `open5e-api` source
- Content is now routed through appropriate renderer based on detected format
- Legacy 5e.tools imports are also auto-detected
- All HTML content is sanitized with DOMPurify

**Rendering Logic:**
```typescript
if (importedFrom === "adnd2e-wiki") {
  // Always render as HTML (already converted from wikitext)
  return <div dangerouslySetInnerHTML={...} />
}

if (importedFrom === "open5e-api") {
  // Auto-detect format and render appropriately
  const format = detectContentFormat(content);
  if (format === "html") {
    return <div dangerouslySetInnerHTML={...} />
  }
  return <MarkdownRenderer ... />
}

// Default: auto-detect for unknown sources
```

### 3. Updated: `src/app/(global)/wiki/page.tsx`
Updated the `renderArticleContent` function to explicitly handle Open5e API content:

```typescript
} else if (article.importedFrom === "open5e-api") {
  // Open5e API content - already formatted, may contain HTML
  // The WikiContent component will detect and handle the format
  return article.rawContent;
```

## How It Works

### For D&D 5e (Open5e API)
1. Content is imported from `https://api.open5e.com/`
2. Stored in database with `importedFrom = "open5e-api"`
3. When rendering:
   - WikiContent component receives the content
   - Detects format (usually plain text with `\n` line breaks)
   - Routes through appropriate renderer
   - Sanitizes any HTML through DOMPurify

### For AD&D 2e (Fandom Wiki)
1. Content is imported from Fandom Wiki
2. Stored in database with `importedFrom = "adnd2e-wiki"`
3. When rendering:
   - WikiContent receives wikitext-converted HTML
   - Recognized as `adnd2e-wiki` source
   - HTML is sanitized and rendered directly

### For Legacy 5e.tools
1. Content is stored with `importedFrom = "dnd5e-tools"` or null
2. Format is auto-detected
3. Rendered appropriately based on detected format

## Components Affected
The fix applies to all components that use `WikiContent`:

1. **Imported Articles Tab** (`src/app/(global)/wiki/page.tsx`)
   - Displays imported wiki entries with expandable details

2. **Wiki Entities Display** (`src/components/ui/wiki-entities-display.tsx`)
   - Shows assigned wiki items on characters, locations, sessions
   - Groups content by type (spells, monsters, magic items, etc.)

3. **Character Detail** (referenced in `src/components/character/CharacterDetail.tsx`)
   - Shows assigned wiki entities for a character

4. **Character Form** (referenced in `src/components/character/CharacterForm.tsx`)
   - Shows assigned wiki spells and other entities

5. **Location Detail** (referenced in `src/app/(global)/...`)
   - Shows wiki entities assigned to locations

## Content Format Detection

### HTML Detection
Looks for HTML tags using regex: `/<\/?[a-z][\s\S]*?>/i`

Examples detected as HTML:
- `<p>Text</p>`
- `<strong>Bold</strong>`
- `<br />`
- `<div class="container">...</div>`

### Markdown Detection
Looks for Markdown syntax: `/([*_`#\[\-])|(\n\s*[-*+])|(\n\s*\d+\.)/`

Examples detected as Markdown:
- `**bold** text`
- `_italic_ text`
- `# Heading`
- `- List item`
- `1. Numbered item`

### Plaintext
Fallback if no HTML or Markdown is detected

## Security Considerations

✅ **Safe:** All HTML content is sanitized using DOMPurify
- Removes potentially harmful scripts and attributes
- Preserves formatting and structure
- Follows OWASP recommendations

✅ **Safe:** Open5e API returns pre-sanitized content
- No user input is stored
- API responses are trusted sources

✅ **Safe:** Wikitext conversion is controlled
- Uses established WikiDataService conversion
- No untrusted input processing

## Testing Checklist

After deployment, verify:

- [ ] D&D 5e spell import shows formatted text (bold, lists, paragraphs)
- [ ] D&D 5e magic item import displays properly formatted description
- [ ] D&D 5e monster import shows creature details correctly
- [ ] AD&D 2e wiki imports still render correctly
- [ ] No raw HTML tags appear in the UI
- [ ] Line breaks and formatting are preserved
- [ ] Links and code blocks render properly
- [ ] Typography matches existing prose styling
- [ ] Search preview cards display content without HTML tags
- [ ] Imported articles tab shows full formatted content

## Backward Compatibility

✅ **Fully Backward Compatible:**
- AD&D 2e imports continue to work as before
- 5e.tools imports continue to work as before
- No database migrations required
- No API changes
- Gracefully handles unknown import sources

## Performance Impact

Minimal:
- Format detection uses simple regex patterns (negligible CPU cost)
- Detection only runs at render time (not on import)
- No additional database queries
- DOMPurify sanitization is already used for AD&D 2e

## Future Enhancements

Possible improvements:
1. Cache detected format in parsedData for faster rendering
2. Add support for additional markup formats (AsciiDoc, reStructuredText)
3. Implement custom HTML-to-Markdown converter for mixed content
4. Add user preference for content display format
