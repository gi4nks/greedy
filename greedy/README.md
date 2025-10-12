# 🏰 Adventure Diary - A Modern D&D Campaign Manager

_Organize your worlds, characters, and adventures — all in one elegant app._

Adventure Diary is a comprehensive web application designed for Dungeons & Dragons players and Dungeon Masters to manage their campaigns, characters, adventures, and sessions. Built with modern web technologies, it provides an intuitive interface for tracking your D&D world with features like character sheets, session logs, quest management, location tracking, and relationship graphs.

## ✨ Key Features

- **📖 Campaign Management**: Create and organize multiple D&D campaigns with detailed descriptions and status tracking
- **👥 Character Sheets**: Comprehensive character management with classes, races, equipment, and magic items
- **🗺️ Adventure Tracking**: Organize adventures within campaigns with timelines and status updates
- **📝 Session Logs**: Record detailed session notes with rich markdown support and image attachments
- **🎯 Quest Management**: Track quests, objectives, and progress within your campaigns
- **📍 Location Mapping**: Create and connect locations within your campaign world
- **📚 Wiki Integration**: Build a living wiki of articles, monsters, spells, and lore
- **🖼️ Image Galleries**: Upload and manage images for characters, locations, and sessions
- **🔗 Relationship Graphs**: Visualize connections between characters, locations, and entities
- **📊 Analytics Dashboard**: Track campaign progress and engagement metrics

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: TailwindCSS + DaisyUI (Emerald & CMYK themes)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Graphs**: D3.js + React Force Graph
- **Markdown**: React Markdown with syntax highlighting

### Backend
- **Runtime**: Node.js 20
- **Framework**: Next.js API Routes
- **Database**: SQLite with Drizzle ORM
- **Validation**: Zod
- **File Storage**: Local filesystem with image optimization

### DevOps & Tools
- **Containerization**: Docker + Docker Compose
- **Linting**: ESLint
- **Package Manager**: npm
- **Database Migrations**: Drizzle Kit
- **Development**: Hot-reload with volume mounting

## 📁 Project Structure

```
greedy/
├── app/                          # Next.js App Router pages
│   ├── campaigns/                # Campaign management pages
│   │   ├── [id]/                 # Campaign-scoped pages
│   │   │   ├── adventures/       # Adventure management
│   │   │   ├── characters/       # Character management
│   │   │   ├── locations/        # Location management
│   │   │   ├── quests/           # Quest management
│   │   │   ├── sessions/         # Session management
│   │   │   └── network/          # Relationship visualization
│   │   ├── new/                  # Create new campaign
│   │   └── page.tsx              # Campaigns list
│   ├── characters/               # Global character pages
│   ├── relationships/            # NPC relationship management
│   ├── search/                   # Global search
│   ├── sessions/                 # Global session pages
│   ├── wiki/                     # Wiki articles and entities
│   └── api/                      # REST API endpoints
├── components/                   # Reusable React components
│   ├── ui/                       # DaisyUI-based UI components
│   ├── adventure/                # Adventure-specific components
│   ├── campaign/                 # Campaign-specific components
│   ├── character/                # Character-specific components
│   ├── location/                 # Location-specific components
│   ├── quest/                    # Quest-specific components
│   ├── session/                  # Session-specific components
│   └── wiki/                     # Wiki-specific components
├── lib/                          # Core application logic
│   ├── actions/                  # Server actions for data operations
│   ├── db/                       # Database schema and connection
│   ├── services/                 # Business logic services
│   └── utils/                    # Utility functions
├── public/                       # Static assets
├── scripts/                      # Database setup and migration scripts
├── Dockerfile                    # Production container
├── Dockerfile.dev                # Development container
└── docker-compose.*.yml          # Docker Compose configurations
```

### Architecture Notes

- **Campaign-Scoped Entities**: Most entities (adventures, characters, quests, etc.) are scoped within campaigns, following the pattern `campaigns/[id]/entity/`
- **Global Pages**: Some entities like wiki articles and relationships have global pages at the root level
- **API Routes**: RESTful API endpoints mirror the page structure for data operations
- **Component Organization**: Components are organized by feature/domain for maintainability

## 🚀 Setup and Installation

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **Docker & Docker Compose** (for containerized deployment)
- **Git** (for cloning the repository)

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd greedy/greedy
   ```

2. **Start the development environment**
   ```bash
   # From the project root (greedy/)
   docker-compose -f docker-compose.dev.yml --profile dev up --build
   ```

3. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - The app will automatically reload when you make changes to the code

### Local Development Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd greedy/greedy
   npm install
   ```

2. **Set up the database**
   ```bash
   # Initialize the database
   npm run init-db

   # Run any pending migrations
   npm run migrate
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

## 🔄 Development Workflow

### Hot-Reload Development

The Docker development setup provides hot-reloading without container restarts:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml --profile dev up

# Make changes to code - they'll appear instantly in the browser
# No need to rebuild containers for code changes
```

### Code Quality

- **Linting**: ESLint with Next.js configuration
  ```bash
  npm run lint
  ```

- **Type Checking**: TypeScript strict mode enabled
  ```bash
  npx tsc --noEmit
  ```

### Database Operations

- **Initialize Database**: Set up initial schema and seed data
  ```bash
  npm run init-db
  ```

- **Run Migrations**: Apply database schema changes
  ```bash
  npm run migrate
  ```

## 🏗️ Architecture Overview

### Frontend-Backend Interaction

The application uses Next.js App Router with Server Components and Client Components:

- **Server Components**: Handle data fetching and initial rendering
- **Client Components**: Manage interactive UI elements and state
- **Server Actions**: Handle form submissions and data mutations
- **API Routes**: Provide REST endpoints for complex operations

### Data Flow

```
User Interaction → Server Action/API Route → Drizzle ORM → SQLite Database
                                      ↓
Database Response → Server Component → Client Component → UI Update
```

### Key Features Implementation

#### Wiki System
- **Storage**: Wiki articles stored in `wiki_articles` table
- **Linking**: Articles connected to entities via `wiki_article_entities` junction table
- **Rendering**: Markdown content with syntax highlighting and image support

#### Image Management
- **Upload**: Images stored locally with metadata tracking
- **Display**: Carousel component with lazy loading
- **Optimization**: Automatic image optimization via Next.js Image component

#### Relationship Graph
- **Visualization**: D3.js force-directed graph for entity relationships
- **Data**: Dynamic relationship data from database queries
- **Interactivity**: Zoom, pan, and node selection capabilities

#### Shared Type System
- **Type Safety**: Centralized TypeScript interfaces for all entities
- **Validation**: Zod schemas for runtime data validation
- **Consistency**: Shared types across frontend and backend

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following our coding standards
4. Test thoroughly and ensure all tests pass
5. Submit a pull request

### Coding Standards
- **UI Consistency**: Use only DaisyUI components and Tailwind classes (no custom CSS)
- **TypeScript**: Strict typing required, no `any` types
- **Component Structure**: Follow the established component organization
- **Commit Messages**: Use conventional commits format

### Code Quality
- Run linting before committing: `npm run lint`
- Ensure TypeScript compilation passes: `npx tsc --noEmit`
- Test your changes in both development and production builds

## 🚢 Deployment

### Production Deployment

1. **Build the production image**
   ```bash
   docker-compose -f docker-compose.app.yml up --build -d
   ```

2. **Access the application**
   - The app will be available at `http://localhost:3000`

### Environment Variables for Production

```env
# Database
DATABASE_URL="file:./campaign.db"

# Next.js
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_TELEMETRY_DISABLED=1

# Production
NODE_ENV=production
```

### Database Persistence

- **Backup**: Regularly backup the `campaign.db` file
- **Migration**: Run migrations before deploying schema changes
- **Volume Mounting**: Database file is mounted as a volume for persistence

## 🔮 Known Issues & Future Improvements

### Current Limitations
- **Graph Performance**: Large relationship graphs may have performance issues
- **Image Storage**: Local filesystem storage (consider cloud storage for production)
- **Real-time Updates**: No real-time synchronization between users

### Planned Enhancements
- **Enhanced Graph Visualization**: Improved interactivity and performance
- **Cloud Storage Integration**: Support for AWS S3, Cloudinary, etc.
- **Collaborative Features**: Real-time collaboration for campaign management
- **Mobile App**: React Native companion app
- **Advanced Analytics**: More detailed campaign insights and reports
- **Import/Export**: Campaign data import/export functionality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the D&D community**

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/your-username/greedy).
