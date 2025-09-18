.PHONY: build build-dev up start stop status down clean dev-up dev-start dev-frontend dev-backend rebuild-frontend rebuild-backend logs help

# Build all images (no-cache, verbose)
build:
	@echo "🔨 Building images (no-cache, verbose)..."
	docker compose --progress auto --profile dev build --no-cache

# Development build (uses dev profile)
build-dev:
	@echo "🔨 Building development images (no-cache, verbose)..."
	docker compose --progress auto --profile dev build --no-cache

# Start services in foreground (shows logs)
up:
	docker compose --profile dev up --build

# Start services detached
start:
	docker compose --profile dev up -d

# Stop and remove containers
stop:
	docker compose --profile dev down

# Show status of containers
status:
	@echo "📊 Container Status:"
	docker compose --profile dev ps

# Stop, remove containers and volumes
down:
	docker compose --profile dev down -v --remove-orphans

# Clean (full)
clean:
	docker compose --profile dev down -v --rmi all --remove-orphans

# Start development stack (foreground, uses dev profile)
dev-up:
	docker compose --profile dev up --build

# Start development stack detached
dev-start:
	docker compose --profile dev up -d --build

# Start only frontend in dev profile (foreground)
dev-frontend:
	docker compose --profile dev up --build frontend

# Start only backend in dev profile (foreground)
dev-backend:
	docker compose --profile dev up --build backend

# Rebuild and restart only frontend (dev)
rebuild-frontend:
	@echo "🔁 Rebuilding frontend (dev profile)..."
	docker compose --progress auto --profile dev build --no-cache frontend
	docker compose --profile dev up -d --no-deps frontend

# Rebuild and restart only backend (dev)
rebuild-backend:
	@echo "🔁 Rebuilding backend (dev profile)..."
	docker compose --progress auto --profile dev build --no-cache backend
	docker compose --profile dev up -d --no-deps backend

# Follow logs (use dev profile by default)
logs:
	docker compose --profile dev logs -f --tail=200

help:
	@echo "Available targets:"
	@echo "  build             - Build all images"
	@echo "  build-dev         - Build development images"
	@echo "  up                - Start services (foreground)"
	@echo "  start             - Start services (detached)"
	@echo "  stop              - Stop services"
	@echo "  status            - Show container status"
	@echo "  down              - Stop & remove containers"
	@echo "  clean             - Remove containers, images, volumes"
	@echo "  dev-up            - Start dev stack (foreground)"
	@echo "  dev-start         - Start dev stack (detached)"
	@echo "  dev-frontend      - Start frontend (dev)"
	@echo "  dev-backend       - Start backend (dev)"
	@echo "  rebuild-frontend  - Rebuild and restart frontend (dev)"
	@echo "  rebuild-backend   - Rebuild and restart backend (dev)"
	@echo "  logs              - Follow logs (dev profile)"