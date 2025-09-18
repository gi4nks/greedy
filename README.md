# Greedy - Local AD&D Campaign Manager

This repository contains a local, Dockerized AD&D campaign manager:
- Frontend: React + Vite + Tailwind, served by `nginx`.
- Backend: Node + Express with SQLite (via `better-sqlite3`).

## Quick Start

### Production Mode
```bash
# Build and start services
make start

# Or manually:
docker-compose up --build

# Backend API is at http://localhost:3001
# Frontend is at http://localhost:3000 (nginx)
```

### Development Mode (Recommended)
```bash
# Start development containers with hot reload
make dev-up

# Frontend: http://localhost:3000 (with hot reload)
# Backend API: http://localhost:3001 (with hot reload)
```

## Development Workflow

### 🚀 Improved Development Experience

The new development setup allows you to rebuild individual services without stopping the entire stack:

```bash
# Start development environment
make dev-up

# Rebuild only frontend after making changes
make rebuild-frontend

# Rebuild only backend after making changes
make rebuild-backend

# View development logs
make dev-logs

# Stop development containers
make dev-down
```

### 📋 Available Commands

| Command | Description |
|---------|-------------|
| `make dev-up` | Start development containers with hot reload |
| `make rebuild-frontend` | Rebuild and restart only frontend |
| `make rebuild-backend` | Rebuild and restart only backend |
| `make dev-frontend` | Start only development frontend |
| `make dev-backend` | Start only development backend |
| `make dev-logs` | View development container logs |
| `make dev-down` | Stop development containers |
| `make start` | Start production containers |
| `make stop` | Stop all containers |
| `make help` | Show all available commands |

### 🔧 Development Benefits

- **Hot Reload**: Changes are reflected immediately without rebuilding
- **Individual Service Rebuilds**: No need to stop the entire stack
- **Faster Development Cycle**: Rebuild only what you changed
- **Persistent Data**: Database persists across rebuilds
- **Volume Mounting**: Source code changes are reflected in containers

## Data Persistence

- The SQLite DB is persisted on the host at `backend/data/campaign.db`.

## Local Development (Without Docker)

To run backend locally without Docker, ensure Node 18+ and run:

```bash
cd backend
npm install
npm run dev
```

Frontend locally:
```bash
cd frontend
npm install
npm run dev
```

