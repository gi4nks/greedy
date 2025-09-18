#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting Greedy Application with Docker"
echo "==========================================="

if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker first."
  exit 1
fi

if ! command -v docker &> /dev/null; then
  echo "❌ docker command is not available in PATH."
  exit 1
fi

echo "📦 Bringing up containers (detached)..."
if ! docker compose up --build -d; then
  echo "❌ docker compose up failed. Showing diagnostics..."
  echo "--- docker compose config ---"
  docker compose config || true
  echo "--- Recent compose logs ---"
  docker compose logs --tail=300 || true
  exit 1
fi

echo "⏳ Waiting for services to start..."
sleep 5

echo "🔍 Current service status:"
docker compose ps --all

# Backend running?
if docker compose ps --services --filter "status=running" | grep -q backend; then
  echo "✅ Backend container is running"
else
  echo "❌ Backend container is not running"
fi

# DB file check (only if backend container exists)
if docker compose ps --services | grep -q backend; then
  if docker compose exec -T backend test -f /app/data/campaign.db > /dev/null 2>&1; then
    echo "✅ Database file exists"
  else
    echo "ℹ️  Database file not found at /app/data/campaign.db (it may be created on first run)"
  fi
fi

# Lightweight API check (may fail until app ready)
if curl -fsS http://localhost:3001/api/export > /dev/null 2>&1; then
  echo "✅ Backend API responded"
else
  echo "⚠️  Backend API did not respond yet (it may still be starting). Use 'docker compose logs -f' to follow startup."
fi

# Frontend check
if curl -fsS http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Frontend is responding"
else
  echo "⚠️  Frontend not responding yet"
fi

echo ""
echo "🎉 Done. To follow logs: docker compose logs -f"
echo "To run in foreground (see build/runtime output): docker compose up --build"
echo "To rebuild only a service: make rebuild-frontend  # or make rebuild-backend"