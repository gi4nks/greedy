.PHONY: build up down clean dev install-frontend install-backend start

# Build the Docker images
build:
	docker-compose build

# Start the services
up:
	docker-compose up

# Start the services in detached mode
up-d:
	docker-compose up -d

# Start the services in detached mode (alias)
start: up-d
	@echo "Services started in detached mode"

# Stop the services
down:
	docker-compose down

# Stop services and remove containers, networks
clean:
	docker-compose down --volumes --remove-orphans
	docker system prune -f

# Run in development mode (without Docker)
dev: install-frontend install-backend
	@echo "Starting backend in background..."
	@cd backend && npm run dev &
	@echo "Starting frontend..."
	@cd frontend && npm run dev

# Install frontend dependencies
install-frontend:
	cd frontend && npm install

# Install backend dependencies
install-backend:
	cd backend && npm install

# Install all dependencies
install: install-frontend install-backend

# View logs
logs:
	docker-compose logs -f

# Rebuild and restart
restart: down build up

# Run tests (if any)
test:
	@echo "No tests defined yet"

# Help
help:
	@echo "Available commands:"
	@echo "  build          - Build Docker images"
	@echo "  up             - Start services"
	@echo "  up-d           - Start services in detached mode"
	@echo "  down           - Stop services"
	@echo "  clean          - Stop and clean up"
	@echo "  dev            - Run in development mode"
	@echo "  install        - Install all dependencies"
	@echo "  logs           - View logs"
	@echo "  restart        - Rebuild and restart"
	@echo "  test           - Run tests"
	@echo "  help           - Show this help"