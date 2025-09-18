# 🎲 Greedy - AD&D Campaign Manager

A comprehensive, local-first campaign management system for Advanced Dungeons & Dragons tabletop role-playing games. Built with modern web technologies and designed for Dungeon Masters to track their campaigns, characters, quests, and more.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-18+-brightgreen.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## ✨ Features

### 🎯 Core Campaign Management
- **Adventures**: Create and manage multiple campaign arcs and storylines
- **Sessions**: Track gaming sessions with detailed notes and timestamps
- **Timeline**: Chronological view of all campaign events and sessions
- **Characters**: Manage player characters and NPCs with detailed profiles

### ⚔️ Game Mechanics
- **Quests**: Create, track, and manage quests with objectives and assignments
- **Locations**: Map and describe campaign locations and points of interest
- **Magic Items**: Catalog and track magical artifacts and equipment
- **Combat Tracker**: Real-time initiative and combat management
- **Dice Roller**: Built-in dice rolling with advantage/disadvantage support

### 🔍 Advanced Features
- **Global Search**: Search across all campaign content
- **Markdown Support**: Rich text formatting for notes and descriptions
- **Adventure Context**: Link content to specific adventures or keep it global
- **Data Export/Import**: Backup and restore campaign data
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React +      │◄──►│   (Express +    │◄──►│   (SQLite)      │
│    Vite)        │    │    TypeScript)  │    │                 │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Node.js 18+   │    │ • Persistent    │
│ • TypeScript    │    │ • Express.js    │    │ • Local-first   │
│ • Tailwind CSS  │    │ • better-sqlite3│    │ • No cloud req  │
│ • React Router  │    │ • Joi validation│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for local development)
- **Git**

### Production Mode (Recommended)
```bash
# Clone the repository
git clone https://github.com/gi4nks/greedy.git
cd greedy

# Start the application
make start

# Access the application:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Development Mode
```bash
# Start development environment with hot reload
make dev-up

# Frontend: http://localhost:3000 (with hot reload)
# Backend API: http://localhost:3001 (with hot reload)
```

## 📋 Available Commands

### � Docker Commands
| Command | Description |
|---------|-------------|
| `make dev-up` | Start development stack with hot reload |
| `make start` | Start production containers |
| `make stop` | Stop all containers |
| `make rebuild-frontend` | Rebuild only frontend |
| `make rebuild-backend` | Rebuild only backend |
| `make logs` | View container logs |
| `make status` | Show container status |

### � Development Commands
| Command | Description |
|---------|-------------|
| `make backend-dev` | Start backend development server |
| `make frontend-dev` | Start frontend development server |
| `make backend-test` | Run backend tests |
| `make backend-lint` | Lint backend code |
| `make format` | Format all code |
| `make typecheck` | Type check all packages |

### 📦 Setup Commands
| Command | Description |
|---------|-------------|
| `make install-deps` | Install all dependencies |
| `make seed-magic-items` | Seed database with magic items |

## 🎮 Application Pages

### Core Pages
- **`/sessions`** - Manage gaming sessions with notes
- **`/characters`** - Player characters and NPCs
- **`/adventures`** - Campaign arcs and storylines
- **`/quests`** - Quest tracking and objectives
- **`/timeline`** - Chronological campaign view
- **`/locations`** - Campaign locations and maps
- **`/magic-items`** - Magical artifacts catalog
- **`/npcs`** - Non-player characters

### Tools
- **`/dice-roller`** - Interactive dice rolling
- **`/combat-tracker`** - Initiative and combat management
- **`/search`** - Global content search

## 🔌 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Main Endpoints

#### Adventures
- `GET /adventures` - List all adventures
- `POST /adventures` - Create new adventure
- `PUT /adventures/:id` - Update adventure
- `DELETE /adventures/:id` - Delete adventure

#### Characters
- `GET /characters` - List all characters
- `POST /characters` - Create new character
- `PUT /characters/:id` - Update character
- `DELETE /characters/:id` - Delete character

#### Sessions
- `GET /sessions` - List all sessions
- `POST /sessions` - Create new session
- `PUT /sessions/:id` - Update session
- `DELETE /sessions/:id` - Delete session

#### Quests
- `GET /quests` - List all quests
- `POST /quests` - Create new quest
- `PUT /quests/:id` - Update quest
- `DELETE /quests/:id` - Delete quest
- `GET /quests/:id/objectives` - Get quest objectives
- `POST /quests/:id/objectives` - Add quest objective

#### Search
- `GET /search?q=term&adventure=id` - Search across content

## 🛠️ Development Workflow

### 1. Setup Development Environment
```bash
# Install all dependencies
make install-deps

# Start development servers
make dev-up
```

### 2. Development Workflow
```bash
# Make changes to frontend
# Changes auto-reload at http://localhost:3000

# Make changes to backend
# Changes auto-reload, API at http://localhost:3001

# Rebuild individual services when needed
make rebuild-frontend
make rebuild-backend
```

### 3. Code Quality
```bash
# Run all checks
make lint
make format
make typecheck
make test
```

## 🧪 Testing

### Backend Tests
```bash
# Run tests
make backend-test

# Run tests with coverage
make backend-test-coverage

# Run tests in watch mode
make backend-test-watch
```

### Frontend Testing
```bash
# Run linting
make frontend-lint

# Fix linting issues
make frontend-lint-fix
```

## 📁 Project Structure

```
greedy/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── db.ts          # Database connection
│   │   └── server.ts      # Main server file
│   ├── package.json
│   └── Dockerfile
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── App.tsx        # Main app component
│   ├── package.json
│   └── Dockerfile
├── shared/                 # Shared TypeScript types
├── scripts/               # Utility scripts
├── docker-compose.yml     # Docker services
├── Makefile              # Build automation
└── README.md
```

## 💾 Data Persistence

- **Database**: SQLite stored locally at `backend/data/campaign.db`
- **Persistence**: Data survives container restarts
- **Backup**: Copy `backend/data/campaign.db` to backup your campaign
- **No Cloud Required**: Everything runs locally on your machine

## 🔧 Local Development (Without Docker)

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🚀 Deployment

### Production Build
```bash
# Build all services
make build

# Start production containers
make start
```

### Environment Variables
Create `.env` files in `backend/` and `frontend/` directories if needed for custom configuration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `make test`
5. Format code: `make format`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure code passes all linting and formatting checks

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the tabletop RPG community
- Inspired by the needs of Dungeon Masters everywhere
- Thanks to all contributors and the open source community

---

**Happy Adventuring!** 🐉⚔️📚

