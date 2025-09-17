# Greedy - Local AD&D Campaign Manager

This repository contains a local, Dockerized AD&D campaign manager:
- Frontend: React + Vite + Tailwind, served by `nginx`.
- Backend: Node + Express with SQLite (via `better-sqlite3`).

Quick start (macOS / zsh):

```bash
# Build and start services
docker-compose up --build

# Backend API is at http://localhost:3001
# Frontend is at http://localhost:3000 (nginx)
```

Data persistence:
- The SQLite DB is persisted on the host at `backend/data/campaign.db`.

Development notes:
- To run backend locally without Docker, ensure Node 18+ and run:

```bash
cd backend
npm install
node server.js
```

