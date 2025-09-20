# UI Style Standards - Greedy Application

## Overview
This document outlines the established DaisyUI styling patterns and conventions used throughout the Greedy application for consistent user interface design.

## 🎨 **Complete Color System Analysis**

### New Color Palette
The application now uses a balanced blue-themed color palette with excellent readability:

- **Dark Blue** (`#1e40af`): Primary actions (add, create, save) - high contrast
- **Medium Blue** (`#3b82f6`): Secondary actions and links - good visibility  
- **Light Blue** (`#60a5fa`): Accents and highlights - subtle emphasis
- **Sky Blue** (`#0ea5e9`): Informational elements - clear distinction
- **Green** (`#10b981`): Success states - positive feedback
- **Amber** (`#f59e0b`): Warnings and cautions - attention-grabbing
- **Red** (`#ef4444`): Errors and destructive actions - clear danger signal

### Background Colors for Maximum Readability
- **White** (`#ffffff`): Main cards and content areas
- **Very Light Gray** (`#f8fafc`): Secondary backgrounds and forms
- **Light Gray** (`#e2e8f0`): Borders and subtle dividers

### Text Colors for Optimal Contrast
- **Dark Gray** (`#1f2937`): Main body text - excellent readability
- **Medium Gray** (`#374151`): Secondary text and labels
- **Very Dark Gray** (`#111827`): Emphasis and strong text

### Button Color Semantics
All buttons use DaisyUI semantic colors with the new balanced palette:

- **`btn-primary`** (Dark Blue `#1e40af`): Primary actions like Add, Create, Save - highest importance
- **`btn-secondary`** (Medium Blue `#3b82f6`): Secondary actions like Cancel, Back - medium importance
- **`btn-success`** (Green `#10b981`): Positive outcomes like Accept, Complete, Select - success states
- **`btn-warning`** (Amber `#f59e0b`): Cautionary actions like Edit, Update, Modify - requires attention
- **`btn-error`** (Red `#ef4444`): Destructive actions like Delete, Remove - danger actions
- **`btn-ghost`** (Neutral): Subtle actions like Debug, Raw, Close - minimal visual weight
- **`btn-info`** (Sky Blue `#0ea5e9`): Informational actions like Show, View, Details - neutral info
- **`btn-accent`** (Light Blue `#60a5fa`): Special highlights and unique actions - visual emphasis

### Badge Color Semantics
Badges follow the same semantic pattern as buttons:

- **`badge-primary`**: Main categories, tags, primary identifiers (Prussian Blue)
- **`badge-secondary`**: Secondary categories, alternative tags (Blue Green)
- **`badge-success`**: Active/completed states, positive status (Blue Green)
- **`badge-warning`**: Cantrips, caution states, pending items (Selective Yellow)
- **`badge-error`**: Error states, critical issues (UT Orange)
- **`badge-info`**: Informational content, data types, classes (Sky Blue)
- **`badge-accent`**: Special content types, locations, unique items (Sky Blue)
- **`badge-neutral`**: Default/uncategorized content (Prussian Blue)

### Background Color Standards
All backgrounds use clean, readable colors:

- **`bg-base-100`** (White `#ffffff`): Main cards, primary content areas, modal backgrounds - maximum readability
- **`bg-base-200`** (Very Light Gray `#f8fafc`): Secondary content, form sections, nested cards - subtle distinction
- **`bg-base-300`** (Light Gray `#e2e8f0`): Borders, dividers, subtle accents - minimal but visible

### Text Color Standards
- **`text-base-content`** (Dark Gray `#1f2937`): Main text color for excellent readability on light backgrounds
- **Links**: Medium Blue (`#3b82f6`) with Dark Blue hover states (`#1e40af`)
- **Headings**: Dark Blue (`#1e40af`) for clear hierarchy and visual interest
- **Subtle text**: Medium Gray (`#374151`) for metadata and secondary information

### Color Usage Patterns by Component Type

#### Status Indicators
- **Active/Completed**: `badge-success` (Blue Green)
- **Pending/Inactive**: `badge-warning` (Selective Yellow)
- **Error/Critical**: `badge-error` (UT Orange)
- **Info/Neutral**: `badge-info` (Sky Blue)

#### Content Categories (Wiki Import, Parking Lot)
- **Monsters**: `badge-info` (Sky Blue)
- **Spells**: `badge-success` (Blue Green)
- **Magic Items**: `badge-accent` (Sky Blue)
- **Locations**: `badge-warning` (Selective Yellow)
- **Races & Classes**: `badge-neutral` (Prussian Blue)
- **Other Content**: `badge-neutral` (Prussian Blue)

#### Quest Status (Quests.tsx)
- **Active**: `badge-success` (Blue Green)
- **Completed**: `badge-info` (Sky Blue)
- **Cancelled**: `badge-error` (UT Orange)
- **Critical Priority**: `badge-error` (UT Orange)
- **High Priority**: `badge-warning` (Selective Yellow)
- **Medium Priority**: `badge-info` (Sky Blue)
- **Low Priority**: `badge-success` (Blue Green)

#### Spell Levels (Characters.tsx)
- **Cantrips (Level 0)**: `badge-warning` (Selective Yellow)
- **Level 1+**: `badge-info` (Sky Blue)

#### Combat States (CombatTracker.tsx)
- **Health Status**: Color-coded based on percentage using new palette
- **Active Combatant**: `badge-error` (UT Orange) for status effects

### Color Consistency Rules
1. **Use only the new color palette** - Sky Blue, Blue Green, Prussian Blue, Selective Yellow, UT Orange
2. **Always use DaisyUI semantic colors** for buttons and badges
3. **Use base colors only** for backgrounds (`bg-base-100`, `bg-base-200`, `bg-base-300`)
4. **Maintain semantic meaning** - same color should mean same thing across pages
5. **Ensure accessibility** - Prussian Blue text on light backgrounds provides excellent contrast
6. **Use Prussian Blue** as the primary text color for consistency and readability

### Color Migration Status
- **✅ Complete**: DaisyUI theme configuration updated with balanced blue palette
- **✅ Complete**: CSS variables updated for better contrast and readability
- **✅ Complete**: Card backgrounds changed to white for maximum readability
- **✅ Complete**: Wiki content styling updated with dark text on light backgrounds
- **✅ Complete**: Text colors optimized for excellent contrast ratios
- **✅ Complete**: Button gradients configured for semantic meaning:
  - Dark blue for primary "add/create" actions
  - Medium blue for secondary actions  
  - Light blue for accents and highlights
  - Green for success, amber for warnings, red for errors
- **✅ Complete**: Form backgrounds and inputs use light, readable colors
- **✅ Complete**: Menu and navigation elements now have proper contrast

### Accessibility Improvements
- **High Contrast**: Dark text (#1f2937) on white backgrounds (#ffffff)
- **Clear Hierarchy**: Blue headings (#1e40af) stand out without being overwhelming
- **Readable Links**: Medium blue (#3b82f6) with darker hover states
- **Semantic Colors**: Logical color associations (red for danger, green for success)
- **Clean Interface**: Minimal use of colored backgrounds, focus on content readability

## 🔘 **Button Standards**

### Button Sizes
- **Standard size**: `btn-sm` (replaces all `btn-xs`)
- **Usage**: All buttons across the application
- **Exceptions**: None - all buttons standardized to `btn-sm`

### Button Types
- **Primary actions**: `btn btn-primary btn-sm`
- **Secondary actions**: `btn btn-secondary btn-sm`
- **Success actions**: `btn btn-success btn-sm`
- **Warning actions**: `btn btn-warning btn-sm`
- **Error/Danger actions**: `btn btn-error btn-sm`
- **Ghost/Neutral**: `btn btn-ghost btn-sm`
- **Outline style**: `btn btn-outline btn-primary btn-sm`

### Special Button Patterns
- **Collapse/Expand**: `btn btn-circle btn-outline btn-primary btn-sm`
- **Tag removal**: `btn btn-circle btn-sm` (no additional classes)
- **Condition removal**: `btn btn-circle btn-sm btn-ghost`

## 📐 **Spacing Standards**

### Card Spacing
- **Card body padding**: `p-4`
- **Grid gaps**: `gap-4`
- **Vertical spacing**: `space-y-4`

### Form Spacing
- **Form element gaps**: `gap-3`
- **Label margins**: Standard DaisyUI label spacing
- **Button groups**: `gap-2` or `space-x-2`

## 📝 **Typography Hierarchy**

### Headings
- **Main entity titles** (character names, item names, quest titles): `text-xl`
- **Section headers** (form titles, card sections): `text-lg`
- **Sub-elements** (metadata, descriptions): `text-base`
- **Small text** (timestamps, metadata): `text-sm`
- **Extra small** (URLs, IDs): `text-xs`

### Font Weights
- **Form labels**: `font-semibold`
- **Main headings**: `font-semibold` (consistent across all pages)
- **Body text**: Default (normal weight)
- **Bold emphasis**: `font-bold` (sparingly used)

### Special Typography Patterns
- **Card titles**: `card-title text-xl` for main entities, `card-title text-lg` for forms
- **Label text**: `label-text font-semibold`
- **Preview sections**: `text-sm` with `prose prose-sm`

## 🎯 **Component Patterns**

### Cards
```tsx
<div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
  <div className="card-body p-4">
    <h3 className="card-title text-xl">Entity Name</h3>
    {/* Content */}
  </div>
</div>
```

### Forms
```tsx
<div className="form-control">
  <label className="label">
    <span className="label-text font-semibold">Field Label</span>
  </label>
  <input className="input input-bordered input-primary w-full h-9" />
</div>
```

### Buttons in Cards
```tsx
<div className="card-actions">
  <button className="btn btn-warning btn-sm">Edit</button>
  <button className="btn btn-error btn-sm">Delete</button>
</div>
```

## 📊 **Layout Patterns**

### Grid Systems
- **Two-column forms**: `grid grid-cols-1 lg:grid-cols-2 gap-4`
- **Three-column layouts**: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4`
- **Responsive cards**: `grid grid-cols-1 md:grid-cols-2 gap-4`

### Responsive Design
- **Mobile-first**: `grid-cols-1 md:grid-cols-2`
- **Tablet breakpoint**: `md:`
- **Desktop breakpoint**: `lg:`

## 🔍 **Search and Filter Patterns**

### Search Inputs
```tsx
<input
  type="text"
  placeholder="Search..."
  className="input input-bordered input-primary w-full h-9"
/>
```

### Filter Sections
- **Consistent spacing**: `space-y-4`
- **Background**: `bg-base-200` for secondary content
- **Border**: `border border-base-300`

## 📋 **List and Collection Patterns**

### Item Lists
- **Container**: `space-y-4`
- **Individual items**: Cards with `bg-base-100 shadow-xl`
- **Hover effects**: `hover:shadow-2xl transition-shadow`

### Status Indicators
- **Badges**: `badge badge-primary`, `badge badge-success`, etc.
- **Status text**: `text-sm opacity-70`

## 🎲 **Specialized Components**

### Combat Tracker
- **Combatant cards**: Standard card pattern
- **Status effects**: `badge badge-error gap-1`
- **HP/AC display**: `text-sm text-base-content/70`

### Wiki Import
- **Search results**: `card bg-base-200 hover:bg-base-300`
- **Article titles**: `card-title text-lg` (standardized)
- **Metadata**: `text-xs opacity-60`

### Dice Roller
- **Result display**: `text-2xl font-bold`
- **History items**: Standard card pattern

## ✅ **Validation Checklist**

When adding new components or pages:

1. **Buttons**: All use `btn-sm`, appropriate semantic color variants (`btn-primary`, `btn-success`, etc.)
2. **Typography**: Follow hierarchy (text-xl → text-lg → text-base → text-sm → text-xs)
3. **Spacing**: Use `p-4`, `gap-4`, `space-y-4` consistently
4. **Colors**: 
   - Use DaisyUI semantic colors only (no raw Tailwind colors)
   - Backgrounds: `bg-base-100`, `bg-base-200` only
   - Buttons: Semantic variants (`btn-primary`, `btn-success`, etc.)
   - Badges: Semantic variants (`badge-primary`, `badge-success`, etc.)
5. **Cards**: `bg-base-100 shadow-xl` with `p-4` body padding
6. **Forms**: `font-semibold` labels, `h-9` input heights
7. **Font weights**: `font-semibold` for labels and main headings

## 🚀 **Future Development**

- Maintain these patterns for all new features
- Use established color scheme consistently
- Follow responsive design patterns
- Keep button sizes standardized to `btn-sm`
- Preserve typography hierarchy
- Document any new patterns that emerge

---

*Last updated: December 2024*
*Maintained by: Development Team*</content>
<parameter name="filePath">/Users/gianluca/Projects/github/gi4nks/greedy/frontend/UI_STYLE_STANDARDS.md