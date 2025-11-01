<<<<<<< HEAD
# 🏰 Greedy - A Modern D&D Campaign Manager

_Organize your worlds, characters, and adventures — all in one elegant app._

Greedy is a comprehensive web application designed for Dungeons & Dragons players and Dungeon Masters to manage their campaigns, characters, adventures, and sessions. Built with modern web technologies, it provides an intuitive interface for tracking your D&D world with features like character sheets, session logs, quest management, location tracking, diary entries, and deep wiki integration.

## ✨ Key Features

### Core Campaign Management
- **📖 Campaign Management**: Create and organize multiple D&D campaigns with detailed descriptions and status tracking
- **🎲 Multiple Game Edition Support**: Support for both AD&D 2e and D&D 5e content with edition-aware imports
- **👥 Character Sheets**: Comprehensive character management with classes, races, equipment, magic items, and ability scores
- **🗺️ Adventure Tracking**: Organize adventures within campaigns with timelines, status updates, and session tracking
- **📝 Session Logs**: Record detailed session notes with rich markdown support, image attachments, and character linking
- **🎯 Quest Management**: Track quests, objectives, progress, priority levels, and due dates within campaigns

### Narrative & Tracking Features
- **📖 Character Diary**: Keep personal narrative journals for each character with dated entries and important event marking
- **📍 Location Mapping**: Create and connect locations within your campaign world with descriptions and images
- **� Magic Item Tracking**: Manage magic items with rarity levels, properties, attunement requirements, and character assignments
- **🔗 Relationship System**: Build intricate relationship networks between characters, NPCs, locations, and other entities

### Wiki & Content Integration
- **📚 Dual Wiki System**: 
  - AD&D 2e content from Fandom Wiki with full-text search
  - D&D 5e content from Open5e API with real-time updates
- **🎲 Wiki Article Management**: Import, organize, and link wiki articles to campaign entities
- **🔍 Smart Categorization**: Automatic detection of spell, monster, magic-item, class, race, weapon, armor, location, NPC, deity, organization, and artifact content
- **🖇️ Entity Linking**: Connect wiki articles to characters, NPCs, locations, sessions, and quests for rich cross-referencing
- **🎨 HTML Rendering**: Full support for rendering complex HTML content from wiki sources

### Visual & Media Features
- **🖼️ Image Galleries**: Upload and manage images for characters, locations, sessions, adventures, and campaigns
- **🎠 Image Carousel**: Interactive carousel viewer with thumbnail navigation, keyboard controls, and touch gestures
- **🔗 Relationship Graphs**: Visualize connections between characters, locations, and entities (planned enhancement)
- **📊 Analytics Dashboard**: Track campaign progress and engagement metrics

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15 (App Router) with Server & Client Components
- **Language**: TypeScript with strict type checking
- **UI Library**: React 19
- **Styling**: TailwindCSS + DaisyUI (Emerald & CMYK themes)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Markdown**: React Markdown with syntax highlighting
- **Forms**: Custom form validation with Zod

### Backend

- **Runtime**: Node.js 20
- **Framework**: Next.js API Routes + Server Actions
- **Database**: SQLite with Drizzle ORM
- **Validation**: Zod schemas for runtime validation
- **File Storage**: Local filesystem with image optimization
- **Logging**: Structured logging for debugging

### DevOps & Tools

- **Containerization**: Docker + Docker Compose (dev, app, and production configs)
- **Linting**: ESLint with React hooks rules enforcement
- **Package Manager**: npm
- **Database Migrations**: Drizzle Kit with SQL migrations
- **Development**: Hot-reload with volume mounting for instant feedback

## 📁 Project Structure

```
greedy/
├── src/
│   ├── app/                              # Next.js App Router pages
│   │   ├── (global)/                     # Route group for global pages
│   │   │   ├── wiki/                     # Wiki articles, search, and import
│   │   │   ├── analytics/                # Analytics dashboard
│   │   │   ├── magic-items/              # Global magic item management
│   │   │   ├── search/                   # Global search functionality
│   │   │   └── ...
│   │   ├── api/                          # REST API endpoints
│   │   │   ├── campaigns/                # Campaign API routes
│   │   │   ├── wiki-articles/            # Wiki article creation and management
│   │   │   ├── images/                   # Image upload and management
│   │   │   └── ...
│   │   ├── campaigns/                    # Campaign-scoped pages
│   │   │   ├── [id]/
│   │   │   │   ├── adventures/           # Adventure management
│   │   │   │   ├── characters/           # Character management with diary support
│   │   │   │   ├── sessions/             # Session logging with entity linking
│   │   │   │   ├── locations/            # Location management
│   │   │   │   ├── quests/               # Quest tracking
│   │   │   │   └── network/              # Relationship visualization
│   │   │   └── page.tsx                  # Campaign list
│   │   └── page.tsx                      # Home page
│   ├── components/                       # Reusable React components
│   │   ├── ui/                           # DaisyUI-based UI components
│   │   │   ├── image-carousel.tsx        # Image viewing with gestures
│   │   │   ├── form-components.tsx       # Shared form components
│   │   │   └── ...
│   │   ├── adventure/                    # Adventure-specific components
│   │   ├── character/                    # Character forms and displays
│   │   ├── session/                      # Session creation and editing
│   │   ├── wiki/                         # Wiki article display and assignment
│   │   └── ...
│   ├── lib/                              # Core application logic
│   │   ├── actions/                      # Server actions for CRUD operations
│   │   ├── db/                           # Database schema and Drizzle connection
│   │   ├── forms/                        # Form validation schemas and utilities
│   │   ├── services/                     # Business logic services
│   │   │   ├── open5e-api.ts             # D&D 5e API integration
│   │   │   ├── wiki-categories.ts        # Wiki categorization logic
│   │   │   └── ...
│   │   └── utils/                        # Utility functions for images, forms, etc.
│   ├── public/                           # Static assets and 5etools data
│   └── middleware.ts                     # Next.js middleware
├── scripts/                              # Database setup and utilities
├── database/                             # SQLite database file location
├── drizzle/                              # SQL migration files
├── Dockerfile                            # Production container
├── docker-compose.*.yml                  # Docker Compose configurations
└── README.md                             # This file
```

## 🚀 Setup and Installation

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **Docker & Docker Compose** (for containerized deployment)
- **npm 10+** (comes with Node.js)

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd greedy
   ```

2. **Start the development environment**
   ```bash
   docker-compose -f docker-compose.dev.yml --profile dev up --build
   ```

3. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - The app reloads automatically on code changes

### Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up the database**
   ```bash
   npm run init-db
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)

### Environment Configuration

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL="file:./campaign.db"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_TELEMETRY_DISABLED=1

# Development
NODE_ENV=development
```

## 🎯 Latest Features (November 2025)

### Recently Added
- ✅ **Character Diary System**: Per-character diary entries with dates and important event tracking
- ✅ **Wiki Article Assignment**: Assign wiki articles (spells, monsters, magic items) to campaign entities
- ✅ **Extended Text Fields**: Characters now support up to 50,000 characters for background and description
- ✅ **Relative URL Support**: Wiki articles can use relative paths for integration flexibility
- ✅ **Session Adventure Linking**: Link sessions to specific adventures for better organization
- ✅ **Form Layout Improvements**: Optimized 3-column grid layouts for better space utilization
- ✅ **Image Carousel Enhancements**: Touch gestures, keyboard navigation, aspect ratio detection

### Recent Fixes
- Fixed React hooks rules violations (moved all hooks before conditional returns)
- Improved wiki article validation with support for relative and absolute URLs
- Fixed adventure form redirect using useEffect to avoid state update during render
- Enhanced form field handling with optional chaining and proper null checks

## 🔄 Development Workflow

### Code Quality Commands

```bash
# Lint the codebase
npm run lint

# Type check
npx tsc --noEmit

# Run database migrations
npm run migrate

# Initialize database
npm run init-db
```

### Form Handling Best Practices

All form submissions use Server Actions with Zod validation:

```typescript
// ✅ Server Action with validation
"use server";
export async function createAdventure(
  prevState: { success: boolean; error?: string },
  formData: FormData
) {
  const validation = validateFormData(AdventureFormSchema, {...});
  if (!validation.success) return { success: false, error: validation.errors };
  // Process form...
}
```

### Component Patterns

- **Form Components**: Use `useActionState` for form submission with optimistic updates
- **Entity Dialogs**: Modal components for assignment and linking operations
- **Images**: Use `EntityImageCarousel` for consistent image viewing experience
- **Validation**: Always validate on both client and server using Zod schemas

## 🏗️ Architecture Highlights

### Server Components + Client Components Strategy

- **Server Components** fetch data securely and handle sensitive operations
- **Client Components** manage interactive UI and real-time user feedback
- **Server Actions** handle mutations with built-in CSRF protection

### Database Schema Features

- **Campaign Scoping**: Most entities belong to a campaign for data isolation
- **Adventure Scoping**: Sessions and related data can be scoped to adventures
- **Entity Relationships**: Flexible relationship system supporting any entity-to-entity connection
- **Diary Entries**: Support for character, location, and quest diary entries with linked entities
- **Wiki Integration**: Two-way linking between wiki articles and campaign entities

## 🚢 Production Deployment

### Docker Production Build

```bash
docker-compose -f docker-compose.app.yml up --build -d
```

### Environment Variables for Production

```env
DATABASE_URL="file:./campaign.db"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
```

### Backup & Maintenance

- Regularly backup the `campaign.db` file
- Test migrations before production deployment
- Monitor container logs: `docker logs <container-id>`

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow coding standards (TypeScript, Zod validation, DaisyUI components)
4. Run `npm run lint` before committing
5. Submit a pull request

### Coding Standards

- ✅ Strict TypeScript (no `any` types)
- ✅ DaisyUI components only for UI consistency
- ✅ Zod schemas for all form validation
- ✅ Server Actions for form submissions
- ✅ Proper error handling and logging

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the D&D community**
=======
# greedy

>>>>>>> ecfda9179dc043ac9d40ef266e645d54808c017d
