.PHONY: install build dev start stop clean test help docker-build docker-build-local docker-build-amd64 docker-build-multi docker-dev docker-start docker-stop docker-restart docker-status docker-logs docker-clean docker-build-lnx docker-build-lnx-push

# Colors for output
BLUE=\033[1;34m
GREEN=\033[1;32m
RED=\033[1;31m
YELLOW=\033[1;33m
NC=\033[0m

# Docker variables
REGISTRY=192.168.1.150:5000
IMAGE_NAME=greedy
TAG=latest
PLATFORMS=linux/arm64,linux/amd64

# Instahelp:
all:
	@echo "📦 Installing dependencies..."
	npm install

# Build the application for production
build:
	@echo "� Building application..."
	npm run build

# Start development server
dev:
	@echo "🚀 Starting development server..."
	npm run dev

# Start production server
start:
	@echo "🚀 Starting production server..."
	npm run start

# Stop any running processes
stop:
	@echo "� Stopping development server..."
	pkill -f "next dev" || true
	pkill -f "next start" || true

# Clean build files and reinstall
clean:
	@echo "🧹 Cleaning build files..."
	rm -rf .next node_modules package-lock.json
	$(MAKE) install

# Run tests
test:
	@echo "🧪 Running tests..."
	npm run test

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
# Docker targets
docker-build-lnx: ## Build and push multi-arch Docker image
	@echo "$(BLUE)Building multi-arch Docker image for ARM & AMD64...$(NC)"
	@docker buildx build --platform linux/amd64,linux/arm64 \
		-t 192.168.1.150:5000/greedy:latest \
		--push .
	@echo "$(GREEN)Docker image built and pushed successfully!$(NC)"
# docker-build:
# 	@echo "$(BLUE)🔧 Checking Docker availability...$(NC)"
# 	@docker --version >/dev/null 2>&1 || (echo "$(RED)❌ Docker CLI not found. Please install Docker.$(NC)" && exit 1)
# 	@echo "$(BLUE)🔧 Checking Docker daemon...$(NC)"
# 	@(docker ps >/dev/null 2>&1 && echo "$(GREEN)✅ Docker daemon is running$(NC)") || (echo "$(RED)❌ Docker daemon not responding. Please ensure Docker Desktop is fully started.$(NC)" && exit 1)

# 	@echo "$(BLUE)🐳 Building Docker image using docker-compose...$(NC)"
# 	@docker compose -f docker-compose.app.yml build --no-cache 2>&1 || (echo "$(RED)❌ Build failed.$(NC)" && exit 1)
# 	@echo "$(BLUE)🏷️  Tagging image for registry...$(NC)"
# 	@docker tag greedy-greedy:latest $(REGISTRY)/$(IMAGE_NAME):$(TAG) 2>&1 || (echo "$(RED)❌ Tagging failed.$(NC)" && exit 1)
# 	@echo "$(BLUE)🐳 Pushing Docker image...$(NC)"
# 	@docker push $(REGISTRY)/$(IMAGE_NAME):$(TAG) 2>&1 || (echo "$(RED)❌ Push failed.$(NC)" && exit 1)

# 	@echo "$(GREEN)✅ Docker image built and pushed successfully to $(REGISTRY)/$(IMAGE_NAME):$(TAG)!$(NC)"

# Build multi-platform Docker images (ARM64 + AMD64)
# docker-build-multi: ## Build and push multi-platform Docker image
# 	@echo "$(BLUE)🔧 Checking Docker availability...$(NC)"
# 	@docker --version >/dev/null 2>&1 || (echo "$(RED)❌ Docker CLI not found. Please install Docker.$(NC)" && exit 1)
# 	@echo "$(BLUE)🔧 Checking Docker daemon...$(NC)"
# 	@(docker ps >/dev/null 2>&1 && echo "$(GREEN)✅ Docker daemon is running$(NC)") || (echo "$(RED)❌ Docker daemon not responding. Please ensure Docker Desktop is fully started.$(NC)" && exit 1)

# 	@echo "$(BLUE)🔧 Checking Docker Buildx...$(NC)"
# 	@docker buildx version >/dev/null 2>&1 || (echo "$(RED)❌ Docker Buildx not available. Please enable Docker Desktop experimental features.$(NC)" && exit 1)

# 	@echo "$(BLUE)🏗️  Creating buildx builder...$(NC)"
# 	@docker buildx create --use --name multi-platform-builder 2>/dev/null || docker buildx use multi-platform-builder 2>/dev/null || true

# 	@echo "$(BLUE)🐳 Building and pushing multi-platform Docker image ($(PLATFORMS))...$(NC)"
# 	@docker buildx build --platform $(PLATFORMS) --push -t $(REGISTRY)/$(IMAGE_NAME):$(TAG) -f Dockerfile . 2>&1 || (echo "$(RED)❌ Multi-platform build failed.$(NC)" && exit 1)

# 	@echo "$(GREEN)✅ Multi-platform Docker image built and pushed successfully to $(REGISTRY)/$(IMAGE_NAME):$(TAG)!$(NC)"
# 	@echo "$(BLUE)ℹ️  Image supports: $(PLATFORMS)$(NC)"

# # Build Docker image for AMD64 platform specifically
# docker-build-amd64: ## Build and push Docker image for AMD64 platform
# 	@echo "$(BLUE)🔧 Checking Docker availability...$(NC)"
# 	@docker --version >/dev/null 2>&1 || (echo "$(RED)❌ Docker CLI not found. Please install Docker.$(NC)" && exit 1)
# 	@echo "$(BLUE)🔧 Checking Docker daemon...$(NC)"
# 	@(docker ps >/dev/null 2>&1 && echo "$(GREEN)✅ Docker daemon is running$(NC)") || (echo "$(RED)❌ Docker daemon not responding. Please ensure Docker Desktop is fully started.$(NC)" && exit 1)

# 	@echo "$(BLUE)🔧 Checking Docker Buildx...$(NC)"
# 	@docker buildx version >/dev/null 2>&1 || (echo "$(RED)❌ Docker Buildx not available. Please enable Docker Desktop experimental features.$(NC)" && exit 1)

# 	@echo "$(BLUE)🏗️  Creating buildx builder...$(NC)"
# 	@docker buildx create --use --name amd64-builder 2>/dev/null || docker buildx use amd64-builder 2>/dev/null || true

# 	@echo "$(BLUE)🐳 Building and pushing AMD64 Docker image...$(NC)"
# 	@docker buildx build --platform linux/amd64 --push -t $(REGISTRY)/$(IMAGE_NAME):$(TAG) -f Dockerfile . 2>&1 || (echo "$(RED)❌ AMD64 build failed.$(NC)" && exit 1)

# 	@echo "$(GREEN)✅ AMD64 Docker image built and pushed successfully to $(REGISTRY)/$(IMAGE_NAME):$(TAG)!$(NC)"

# # Build local Docker image (for testing)
# docker-build-local: ## Build Docker image locally without pushing
# 	@echo "$(BLUE)🔧 Checking Docker availability...$(NC)"
# 	@docker --version >/dev/null 2>&1 || (echo "$(RED)❌ Docker CLI not found. Please install Docker.$(NC)" && exit 1)
# 	@echo "$(BLUE)🔧 Checking Docker daemon...$(NC)"
# 	@(docker ps >/dev/null 2>&1 && echo "$(GREEN)✅ Docker daemon is running$(NC)") || (echo "$(RED)❌ Docker daemon not responding. Please ensure Docker Desktop is fully started.$(NC)" && exit 1)

# 	@echo "$(BLUE)🐳 Building local Docker image...$(NC)"
# 	@docker build -f Dockerfile -t $(IMAGE_NAME):local . 2>&1 || (echo "$(RED)❌ Local build failed.$(NC)" && exit 1)

# 	@echo "$(GREEN)✅ Local Docker image built successfully as $(IMAGE_NAME):local!$(NC)"


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
	$(MAKE) docker-start

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
	docker buildx prune -f 2>/dev/null || true
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
	@echo "🐳 Docker Commands:"
	@echo "  docker-build         - Build and push Docker image (via docker-compose)"
	@echo "  docker-build-local   - Build Docker image locally for testing"
	@echo "  docker-build-amd64   - Build and push AMD64 Docker image"
	@echo "  docker-build-multi   - Build and push multi-platform image (ARM64 + AMD64)"
	@echo "  docker-dev           - Start development environment"
	@echo "  docker-start         - Start production containers"
	@echo "  docker-stop          - Stop all containers"
	@echo "  docker-restart       - Restart Docker containers"
	@echo "  docker-status        - Show container status"
	@echo "  docker-logs          - Show container logs"
	@echo "  docker-clean         - Clean Docker resources"
	@echo ""
	@echo "� Quick Start:"
	@echo "  make install   (first time only)"
	@echo "  make dev       (for development)"
	@echo ""
	@echo "� Development workflow:"
	@echo "  1. make install  (install dependencies)"
	@echo "  2. make dev      (start development - opens on http://localhost:3000)"
	@echo "  3. make stop     (when done)"