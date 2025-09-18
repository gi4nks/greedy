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
	@echo ""
	@echo "🐳 Docker Compose Commands:"
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
	@echo ""
	@echo "🔧 Backend Development Commands:"
	@echo "  backend-dev           - Start backend development server"
	@echo "  backend-build         - Build backend"
	@echo "  backend-test          - Run backend tests"
	@echo "  backend-test-watch    - Run backend tests in watch mode"
	@echo "  backend-test-coverage - Run backend tests with coverage"
	@echo "  backend-lint          - Lint backend code"
	@echo "  backend-lint-fix      - Auto-fix backend linting issues"
	@echo "  backend-format        - Format backend code"
	@echo "  backend-format-check  - Check backend formatting"
	@echo "  backend-typecheck     - Type check backend"
	@echo ""
	@echo "⚛️  Frontend Development Commands:"
	@echo "  frontend-dev          - Start frontend development server"
	@echo "  frontend-build        - Build frontend for production"
	@echo "  frontend-preview      - Preview frontend production build"
	@echo "  frontend-lint         - Lint frontend code"
	@echo "  frontend-lint-fix     - Auto-fix frontend linting issues"
	@echo "  frontend-format       - Format frontend code"
	@echo "  frontend-format-check - Check frontend formatting"
	@echo ""
	@echo "📦 Shared Package Commands:"
	@echo "  shared-build          - Build shared package"
	@echo "  shared-dev            - Build shared package in watch mode"
	@echo "  shared-lint           - Lint shared package code"
	@echo "  shared-lint-fix       - Auto-fix shared package linting issues"
	@echo "  shared-format         - Format shared package code"
	@echo "  shared-format-check   - Check shared package formatting"
	@echo ""
	@echo "🎯 Combined Commands (All Packages):"
	@echo "  install-deps          - Install dependencies for all packages"
	@echo "  lint                  - Lint all packages"
	@echo "  lint-fix              - Auto-fix linting issues in all packages"
	@echo "  format                - Format all packages"
	@echo "  format-check          - Check formatting in all packages"
	@echo "  test                  - Run tests for all packages"
	@echo "  test-coverage         - Run tests with coverage"
	@echo "  typecheck             - Type check all packages"
	@echo ""
	@echo "🌱 Database Commands:"
	@echo "  seed-magic-items      - Seed magic items into backend DB"


# Seed magic items into backend DB (runs inside backend container if available)
.PHONY: seed-magic-items
seed-magic-items:
	@echo "Seeding magic items into DB..."
	-docker compose --profile dev exec -T backend node /app/scripts/seed_magic_items.js || \
		npx ts-node backend/scripts/seed_magic_items.ts

# Backend development commands
.PHONY: backend-dev backend-build backend-test backend-test-watch backend-test-coverage backend-lint backend-lint-fix backend-format backend-format-check backend-typecheck

# Start backend development server
backend-dev:
	@echo "🚀 Starting backend development server..."
	cd backend && npm run dev

# Build backend
backend-build:
	@echo "🔨 Building backend..."
	cd backend && npm run build

# Run backend tests
backend-test:
	@echo "🧪 Running backend tests..."
	cd backend && npm run test

# Run backend tests in watch mode
backend-test-watch:
	@echo "👀 Running backend tests in watch mode..."
	cd backend && npm run test:watch

# Run backend tests with coverage
backend-test-coverage:
	@echo "📊 Running backend tests with coverage..."
	cd backend && npm run test:coverage

# Lint backend code
backend-lint:
	@echo "🔍 Linting backend code..."
	cd backend && npm run lint

# Auto-fix backend linting issues
backend-lint-fix:
	@echo "🔧 Auto-fixing backend linting issues..."
	cd backend && npm run lint:fix

# Format backend code
backend-format:
	@echo "💅 Formatting backend code..."
	cd backend && npm run format

# Check backend formatting
backend-format-check:
	@echo "✅ Checking backend formatting..."
	cd backend && npm run format:check

# Type check backend
backend-typecheck:
	@echo "🔍 Type checking backend..."
	cd backend && npm run typecheck

# Frontend development commands
.PHONY: frontend-dev frontend-build frontend-preview frontend-lint frontend-lint-fix frontend-format frontend-format-check

# Start frontend development server
frontend-dev:
	@echo "🚀 Starting frontend development server..."
	cd frontend && npm run dev

# Build frontend for production
frontend-build:
	@echo "🔨 Building frontend for production..."
	cd frontend && npm run build

# Preview frontend production build
frontend-preview:
	@echo "👀 Previewing frontend production build..."
	cd frontend && npm run preview

# Lint frontend code
frontend-lint:
	@echo "🔍 Linting frontend code..."
	cd frontend && npm run lint

# Auto-fix frontend linting issues
frontend-lint-fix:
	@echo "🔧 Auto-fixing frontend linting issues..."
	cd frontend && npm run lint:fix

# Format frontend code
frontend-format:
	@echo "💅 Formatting frontend code..."
	cd frontend && npm run format

# Check frontend formatting
frontend-format-check:
	@echo "✅ Checking frontend formatting..."
	cd frontend && npm run format:check

# Shared package commands
.PHONY: shared-build shared-dev shared-lint shared-lint-fix shared-format shared-format-check

# Build shared package
shared-build:
	@echo "🔨 Building shared package..."
	cd shared && npm run build

# Build shared package in watch mode
shared-dev:
	@echo "👀 Building shared package in watch mode..."
	cd shared && npm run dev

# Lint shared package code
shared-lint:
	@echo "🔍 Linting shared package code..."
	cd shared && npm run lint

# Auto-fix shared package linting issues
shared-lint-fix:
	@echo "🔧 Auto-fixing shared package linting issues..."
	cd shared && npm run lint:fix

# Format shared package code
shared-format:
	@echo "💅 Formatting shared package code..."
	cd shared && npm run format

# Check shared package formatting
shared-format-check:
	@echo "✅ Checking shared package formatting..."
	cd shared && npm run format:check

# Combined commands
.PHONY: lint lint-fix format format-check test test-coverage typecheck install-deps

# Install dependencies for all packages
install-deps:
	@echo "📦 Installing dependencies for all packages..."
	@echo "Installing root dependencies..."
	npm install
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing shared package dependencies..."
	cd shared && npm install
	@echo "✅ All dependencies installed!"

# Lint all packages
lint:
	@echo "🔍 Linting all packages..."
	$(MAKE) backend-lint
	$(MAKE) frontend-lint
	$(MAKE) shared-lint

# Auto-fix linting issues in all packages
lint-fix:
	@echo "🔧 Auto-fixing linting issues in all packages..."
	$(MAKE) backend-lint-fix
	$(MAKE) frontend-lint-fix
	$(MAKE) shared-lint-fix

# Format all packages
format:
	@echo "💅 Formatting all packages..."
	$(MAKE) backend-format
	$(MAKE) frontend-format
	$(MAKE) shared-format

# Check formatting in all packages
format-check:
	@echo "✅ Checking formatting in all packages..."
	$(MAKE) backend-format-check
	$(MAKE) frontend-format-check
	$(MAKE) shared-format-check

# Run tests for all packages
test:
	@echo "🧪 Running tests for all packages..."
	$(MAKE) backend-test

# Run tests with coverage
test-coverage:
	@echo "📊 Running tests with coverage..."
	$(MAKE) backend-test-coverage

# Type check all packages
typecheck:
	@echo "🔍 Type checking all packages..."
	$(MAKE) backend-typecheck