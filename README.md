# Adventure Diary - D&D Campaign Manager

A modern Next.js application for managing D&D campaigns, sessions, characters, and timelines.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Running
```bash
# Clone the repository
git clone <your-repo-url>
cd greedy

# Install dependencies and start the application
npm run dev
```

The application will be available at `http://localhost:3000`.

### Database
The application uses SQLite with Drizzle ORM. The database file is automatically created and initialized at `greedy/database/campaign.db`.

## 🏗️ Architecture

This is a Next.js 15 application using:
- **App Router** for file-based routing
- **Server Components** for data fetching
- **Server Actions** for mutations
- **Drizzle ORM** with SQLite for the database
- **Tailwind CSS** + **DaisyUI** for styling
- **TypeScript** for type safety

## 📁 Project Structure

```
greedy/
├── app/                 # Next.js App Router
│   ├── campaigns/      # Campaign management pages
│   ├── search/         # Advanced search functionality
│   ├── api/           # API routes
│   └── database/      # SQLite database
├── components/        # Reusable React components
├── lib/              # Utilities and business logic
│   ├── db/           # Database schema and connection
│   ├── actions/      # Server Actions
│   └── services/     # Business logic services
└── public/          # Static assets
```

## ✨ Features

### Core Functionality
- **Campaign Management**: Create and manage multiple D&D campaigns
- **Session Tracking**: Log detailed session notes and events
- **Timeline Visualization**: Interactive timeline of campaign events  
- **Character Management**: Track PCs and NPCs with detailed stats
- **Adventure Tracking**: Organize quests and storylines
- **Advanced Search**: Search across all campaign content
- **Analytics Dashboard**: Insights and statistics across campaigns

### Technical Features
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Server-Side Rendering**: Fast initial page loads
- **Real-time Database**: SQLite with Drizzle ORM
- **Type Safety**: Full TypeScript implementation
- **Modern UI**: Beautiful interface with Tailwind CSS and DaisyUI

## 🔧 Development

```bash
# Start development server
npm run dev

# Build for production (from greedy directory)
cd greedy && npm run build

# Run linting (from greedy directory)
cd greedy && npm run lint
```

## 📝 Recent Updates

✅ **Workspace Cleanup Completed** - Removed old frontend/backend architecture  
✅ **Next.js Migration Complete** - Unified full-stack application  
✅ **All Pages Functional** - Home, Campaigns, Adventures, Characters, Sessions, Search, Analytics  
✅ **Database Initialized** - SQLite database with full schema  
✅ **Navigation Fixed** - All routes working properly  
✅ **Clean Architecture** - Single Next.js application
