.PHONY: install build dev start stop clean test help docker-build docker-dev docker-start docker-stop docker-restart docker-status docker-logs docker-clean

# Instahelp:
	@echo "🎯 Greedy Adventure Diary - Simple Commands:"
	@echo ""
	@echo "📋 Local Development:"
	@echo "  install    - Install dependencies"
	@echo "  build      - Build application for production"
	@echo "  dev        - Start development server"
	@echo "  start      - Start production server"
	@echo "  stop       - Stop any running servers"
	@echo "  status     - Check application status"
	@echo "  clean      - Clean and reinstall everything"
	@echo "  test       - Run tests"
	@echo ""
	@echo "� Docker Commands:"
	@echo "  docker-dev     - Start Docker development environment"
	@echo "  docker-build   - Build Docker production image"
	@echo "  docker-start   - Start Docker production containers"
	@echo "  docker-stop    - Stop Docker containers"
	@echo "  docker-restart - Restart Docker containers"
	@echo "  docker-status  - Show Docker container status"
	@echo "  docker-logs    - Show Docker container logs"
	@echo "  docker-clean   - Clean Docker images and containers"
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  Local:   make install && make dev"
	@echo "  Docker:  make docker-dev"
	@echo ""
	@echo "💡 Development workflow:"
	@echo "  Local: make install → make dev → make stop"
	@echo "  Docker: make docker-dev → make docker-logs → make docker-stop"all:
	@echo "📦 Installing dependencies..."
	cd greedy && npm install

# Build the application for production
build:
	@echo "� Building application..."
	cd greedy && npm run build

# Start development server
dev:
	@echo "🚀 Starting development server..."
	cd greedy && npm run dev

# Start production server
start:
	@echo "🚀 Starting production server..."
	cd greedy && npm run start

# Stop any running processes
stop:
	@echo "� Stopping development server..."
	pkill -f "next dev" || true
	pkill -f "next start" || true

# Clean build files and reinstall
clean:
	@echo "🧹 Cleaning build files..."
	cd greedy && rm -rf .next node_modules package-lock.json
	$(MAKE) install

# Run tests
test:
	@echo "🧪 Running tests..."
	cd greedy && npm run test

# Check application status
status:
	@echo "📊 Application Status:"
	@echo ""
	@echo "🔍 Development Server:"
	@pgrep -f "next dev" > /dev/null && echo "  ✅ Next.js dev server is running" || echo "  ❌ Next.js dev server is not running"
	@pgrep -f "next start" > /dev/null && echo "  ✅ Next.js production server is running" || echo "  ❌ Next.js production server is not running"
	@echo ""
	@echo "🐳 Docker Containers:"
	@docker compose -f docker-compose.dev.yml --profile dev ps --quiet 2>/dev/null | head -3 | while read -r container; do \
		if [ -n "$$container" ]; then \
			container_name=$$(docker inspect --format='{{.Name}}' $$container 2>/dev/null | sed 's|^/||'); \
			container_status=$$(docker inspect --format='{{.State.Status}}' $$container 2>/dev/null); \
			echo "  📦 $$container_name: $$container_status (dev)"; \
		fi; \
	done || echo "  ℹ️  No development containers found"
	@docker compose -f docker-compose.app.yml ps --quiet 2>/dev/null | head -3 | while read -r container; do \
		if [ -n "$$container" ]; then \
			container_name=$$(docker inspect --format='{{.Name}}' $$container 2>/dev/null | sed 's|^/||'); \
			container_status=$$(docker inspect --format='{{.State.Status}}' $$container 2>/dev/null); \
			echo "  📦 $$container_name: $$container_status (prod)"; \
		fi; \
	done || echo "  ℹ️  No production containers found"
	@echo ""
	@echo "💡 Quick Actions:"
	@echo "  make dev     - Start development server"
	@echo "  make stop    - Stop all servers"
	@echo "  make clean   - Clean and restart"

# Docker Commands

# Build Docker images for production
docker-build:
	@echo "🐳 Building Docker production image..."
	docker compose -f docker-compose.app.yml build --no-cache

# Start Docker development environment
docker-dev:
	@echo "🐳 Starting Docker development environment..."
	docker compose -f docker-compose.dev.yml --profile dev up --build -d
	@echo "✅ Development environment started at http://localhost:3000"
	@echo "💡 Use 'make docker-logs' to view logs or 'make docker-stop' to stop"

# Start Docker production containers
docker-start:
	@echo "🐳 Starting Docker production containers..."
	docker compose -f docker-compose.app.yml up -d
	@echo "✅ Production environment started at http://localhost:3000"

# Stop Docker containers
docker-stop:
	@echo "🐳 Stopping Docker containers..."
	docker compose -f docker-compose.dev.yml --profile dev down || true
	docker compose -f docker-compose.app.yml down || true
	@echo "✅ Docker containers stopped"

# Restart Docker containers
docker-restart: docker-stop
	@echo "🐳 Restarting Docker containers..."
	@sleep 2
	$(MAKE) docker-dev

# Show Docker container status
docker-status:
	@echo "🐳 Docker Container Status:"
	@echo ""
	@echo "📊 Development Containers:"
	@docker compose -f docker-compose.dev.yml --profile dev ps 2>/dev/null || echo "  ℹ️  No development containers running"
	@echo ""
	@echo "📊 Production Containers:"
	@docker compose -f docker-compose.app.yml ps 2>/dev/null || echo "  ℹ️  No production containers running"
	@echo ""
	@echo "🔍 Container Details:"
	@docker ps --filter "name=greedy" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  ℹ️  No greedy containers found"

# Show Docker container logs
docker-logs:
	@echo "🐳 Docker Container Logs:"
	@echo ""
	@echo "📝 Following logs (Ctrl+C to stop)..."
	@if docker compose -f docker-compose.dev.yml --profile dev ps -q greedy >/dev/null 2>&1; then \
		docker compose -f docker-compose.dev.yml --profile dev logs -f greedy; \
	elif docker compose -f docker-compose.app.yml ps -q greedy >/dev/null 2>&1; then \
		docker compose -f docker-compose.app.yml logs -f greedy; \
	else \
		echo "  ℹ️  No greedy containers running"; \
	fi

# Clean Docker images and containers
docker-clean:
	@echo "🐳 Cleaning Docker resources..."
	docker compose -f docker-compose.dev.yml --profile dev down --volumes --rmi all || true
	docker compose -f docker-compose.app.yml down --volumes --rmi all || true
	docker system prune -f
	@echo "✅ Docker cleanup completed"

help:
	@echo "🎯 Greedy Adventure Diary - Simple Commands:"
	@echo ""
	@echo "📋 Essential Commands:"
	@echo "  install    - Install dependencies"
	@echo "  build      - Build application for production"
	@echo "  dev        - Start development server (most common)"
	@echo "  start      - Start production server"
	@echo "  stop       - Stop any running servers"
	@echo "  status     - Check application status"
	@echo "  clean      - Clean and reinstall everything"
	@echo "  test       - Run tests"
	@echo ""
	@echo "� Quick Start:"
	@echo "  make install   (first time only)"
	@echo "  make dev       (for development)"
	@echo ""
	@echo "� Development workflow:"
	@echo "  1. make install  (install dependencies)"
	@echo "  2. make dev      (start development - opens on http://localhost:3000)"
	@echo "  3. make stop     (when done)"