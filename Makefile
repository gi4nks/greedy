.PHONY: build up start stop down clean dev install-frontend install-backend install logs restart test help

# Build the Docker images
build:
	docker-compose build

# Start the services in the foreground
up:
	docker-compose up

# Start the services in detached mode

# Start the services using the scripts in ./scripts
start:
	@echo "🚀 Starting application via scripts/docker-start.sh"
	@chmod +x scripts/docker-start.sh
	@./scripts/docker-start.sh

# Stop the services using the helper script
stop:
	@echo "🛑 Stopping application via scripts/docker-stop.sh"
	@chmod +x scripts/docker-stop.sh
	@./scripts/docker-stop.sh

# Stop services and remove containers, networks
clean:
	docker-compose down --volumes --remove-orphans
	docker system prune -f

# Run in development mode (without Docker)
# Starts backend in background and frontend in the foreground
dev: install-frontend install-backend
	@echo "Starting backend in background (host)..."
	@cd backend && npm run dev &
	@echo "Starting frontend in foreground..."
	@cd frontend && npm run dev

# Install frontend dependencies (local)
install-frontend:
	cd frontend && npm ci

# Install backend dependencies.
# Installing backend deps on macOS can fail for native modules; prefer using Docker.
# This target will run npm install inside a Debian-based Node container which
# compiles native modules for Linux (suitable if you run backend in Docker).
install-backend:
	@echo "Installing backend dependencies inside a Node Debian container (recommended)..."
	docker run --rm -v "$(PWD)/backend":/app -w /app node:18-bullseye bash -lc "npm ci --ignore-scripts || npm install --no-audit --no-fund"

# Install all dependencies
install: install-frontend install-backend

# View logs
logs:
	docker-compose logs -f

# Rebuild and restart
restart: down build start

# Run tests (if any)
test:
	@echo "No tests defined yet"

# Help
help:
	@echo "Available commands:"
	@echo "  build                - Build Docker images"
	@echo "  up                   - Start services (foreground)"
	@echo "  start                - Start services (detached)"
	@echo "  stop                 - Stop services (uses ./scripts/docker-stop.sh)"
	@echo "  down                 - Stop services (docker-compose down)"
	@echo "  clean                - Stop and clean up (remove volumes)"
	@echo "  dev                  - Run backend and frontend locally for development"
	@echo "  install              - Install all dependencies (frontend + backend via Docker)"
	@echo "  install-frontend     - Install frontend dependencies locally"
	@echo "  install-backend      - Install backend dependencies inside Docker (recommended)"
	@echo "  logs                 - View docker-compose logs"
	@echo "  restart              - Rebuild images and restart services"
	@echo "  test                 - Run tests"
	@echo "  help                 - Show this help"