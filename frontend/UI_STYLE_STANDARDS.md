# UI Style Standards - Greedy Application

## Overview
This document outlines the established DaisyUI styling patterns and conventions used throughout the Greedy application for consistent user interface design.

## 🎨 **Complete Nord Theme Implementation**

### Nord Color Palette
The application uses DaisyUI's built-in "nord" theme for a clean, readable, and consistent arctic-inspired color scheme:

- **Primary** (`#5E81AC`): Arctic blue for primary actions (add, create, save)
- **Secondary** (`#81A1C1`): Frost blue for secondary actions and links
- **Accent** (`#88C0D0`): Light blue for accents and highlights
- **Success** (`#A3BE8C`): Polar green for success states
- **Warning** (`#EBCB8B`): Aurora amber for warnings and cautions
- **Error** (`#BF616A`): Aurora red for errors and destructive actions
- **Info** (`#81A1C1`): Frost blue for informational elements

### Background Colors for Arctic Theme
- **Base-100** (`#ECEFF4`): Snow white for main cards and content areas
- **Base-200** (`#E5E9F0`): Light snow for secondary backgrounds and forms
- **Base-300** (`#D8DEE9`): Lighter snow for borders and subtle dividers

### Text Colors for Nord Theme
- **Base-Content** (`#2E3440`): Polar night dark for main body text
- **Base-Content/70** (`#4C566A`): Frost gray for secondary text and labels
- **Base-Content/50** (`#81A1C1`): Light frost for subtle text

### Button Color Semantics
All buttons use DaisyUI semantic colors with the nord theme:

- **`btn-primary`** (Arctic Blue `#5E81AC`): Primary actions like Add, Create, Save - highest importance
- **`btn-secondary`** (Frost Blue `#81A1C1`): Secondary actions like Cancel, Back - medium importance
- **`btn-success`** (Polar Green `#A3BE8C`): Positive outcomes like Accept, Complete, Select - success states
- **`btn-warning`** (Aurora Amber `#EBCB8B`): Cautionary actions like Edit, Update, Modify - requires attention
- **`btn-error`** (Aurora Red `#BF616A`): Destructive actions like Delete, Remove - danger actions
- **`btn-ghost`**: Subtle actions like Debug, Raw, Close - minimal visual weight
- **`btn-info`** (Frost Blue `#81A1C1`): Informational actions like Show, View, Details - neutral info
- **`btn-accent`** (Light Blue `#88C0D0`): Special highlights and unique actions - visual emphasis

### Badge Color Semantics
Badges follow the same semantic pattern as buttons:

- **`badge-primary`**: Main categories, tags, primary identifiers (Arctic Blue)
- **`badge-secondary`**: Secondary categories, alternative tags (Frost Blue)
- **`badge-success`**: Active/completed states, positive status (Polar Green)
- **`badge-warning`**: Cantrips, caution states, pending items (Aurora Amber)
- **`badge-error`**: Error states, critical issues (Aurora Red)
- **`badge-info`**: Informational content, data types, classes (Frost Blue)
- **`badge-accent`**: Special content types, locations, unique items (Light Blue)
- **`badge-neutral`**: Default/uncategorized content (Polar Night)

### Background Color Standards
All backgrounds use clean, nord-themed colors:

- **`bg-base-100`** (Snow `#ECEFF4`): Main cards, primary content areas, modal backgrounds - maximum readability
- **`bg-base-200`** (Light Snow `#E5E9F0`): Secondary content, form sections, nested cards - subtle distinction
- **`bg-base-300`** (Lighter Snow `#D8DEE9`): Borders, dividers, subtle accents - minimal but visible

### Text Color Standards
- **`text-base-content`** (Polar Night `#2E3440`): Main text color for excellent readability on light nord backgrounds
- **Links**: Frost Blue (`#81A1C1`) with Arctic Blue hover states (`#5E81AC`)
- **Headings**: Arctic Blue (`#5E81AC`) for clear hierarchy and visual interest
- **Subtle text**: Frost Gray (`#4C566A`) for metadata and secondary information

### Color Usage Patterns by Component Type

#### Status Indicators
- **Active/Completed**: `badge-success` (Polar Green)
- **Pending/Inactive**: `badge-warning` (Aurora Amber)
- **Error/Critical**: `badge-error` (Aurora Red)
- **Info/Neutral**: `badge-info` (Frost Blue)

#### Content Categories (Wiki Import, Parking Lot)
- **Monsters**: `badge-info` (Frost Blue)
- **Spells**: `badge-success` (Polar Green)
- **Magic Items**: `badge-accent` (Light Blue)
- **Locations**: `badge-warning` (Aurora Amber)
- **Races & Classes**: `badge-neutral` (Polar Night)
- **Other Content**: `badge-neutral` (Polar Night)

#### Quest Status (Quests.tsx)
- **Active**: `badge-success` (Polar Green)
- **Completed**: `badge-info` (Frost Blue)
- **Cancelled**: `badge-error` (Aurora Red)
- **Critical Priority**: `badge-error` (Aurora Red)
- **High Priority**: `badge-warning` (Aurora Amber)
- **Medium Priority**: `badge-info` (Frost Blue)
- **Low Priority**: `badge-success` (Polar Green)

#### Spell Levels (Characters.tsx)
- **Cantrips (Level 0)**: `badge-warning` (Aurora Amber)
- **Level 1+**: `badge-info` (Frost Blue)

#### Combat States (CombatTracker.tsx)
- **Health Status**: Color-coded based on percentage using nord palette
- **Active Combatant**: `badge-error` (Aurora Red) for status effects

### Color Consistency Rules
1. **Use only the nord theme colors** - Arctic, Frost, Polar, Aurora colors
2. **Always use DaisyUI semantic colors** for buttons and badges
3. **Use base colors only** for backgrounds (`bg-base-100`, `bg-base-200`, `bg-base-300`)
4. **Maintain semantic meaning** - same color should mean same thing across pages
5. **Ensure accessibility** - Polar Night text on snow backgrounds provides excellent contrast
6. **Use Arctic Blue** as the primary text color for consistency and readability

### Nord Theme Migration Status
- **✅ Complete**: DaisyUI theme configuration updated to use built-in "nord" theme
- **✅ Complete**: CSS variables updated for nord color palette
- **✅ Complete**: Card backgrounds changed to snow white for maximum readability
- **✅ Complete**: Wiki content styling updated with polar night text on light backgrounds
- **✅ Complete**: Text colors optimized for excellent contrast ratios
- **✅ Complete**: Button gradients configured for nord semantic meaning:
  - Arctic blue for primary "add/create" actions
  - Frost blue for secondary actions  
  - Light blue for accents and highlights
  - Polar green for success, aurora amber for warnings, aurora red for errors
- **✅ Complete**: Form backgrounds and inputs use light, readable nord colors
- **✅ Complete**: Menu and navigation elements now have proper nord contrast

### Accessibility Improvements
- **High Contrast**: Polar night text (#2E3440) on snow backgrounds (#ECEFF4)
- **Clear Hierarchy**: Arctic blue headings (#5E81AC) stand out without being overwhelming
- **Readable Links**: Frost blue (#81A1C1) with darker hover states
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
   - Use DaisyUI nord theme semantic colors only (no raw Tailwind colors)
   - Backgrounds: `bg-base-100`, `bg-base-200` only
   - Buttons: Semantic variants (`btn-primary`, `btn-success`, etc.)
   - Badges: Semantic variants (`badge-primary`, `badge-success`, etc.)
5. **Cards**: `bg-base-100 shadow-xl` with `p-4` body padding
6. **Forms**: `font-semibold` labels, `h-9` input heights
7. **Font weights**: `font-semibold` for labels and main headings

## 🚀 **Future Development**

- Maintain these patterns for all new features
- Use established nord color scheme consistently
- Follow responsive design patterns
- Keep button sizes standardized to `btn-sm`
- Preserve typography hierarchy
- Document any new patterns that emerge

---

*Last updated: September 2025*
*Theme: DaisyUI Nord*
*Maintained by: Development Team*</content>
<parameter name="filePath">/Users/gianluca/Projects/github/gi4nks/greedy/frontend/UI_STYLE_STANDARDS.md