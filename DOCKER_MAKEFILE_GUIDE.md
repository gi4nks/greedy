# Docker and Makefile Guide for Adventure Diary

## Overview

Adventure Diary is a modern D&D campaign management application built with Next.js 15, featuring a comprehensive Makefile and Docker setup for both development and production environments.

## Prerequisites

Before getting started, ensure you have the following installed:

- **Docker & Docker Compose**: Version 20.10+ recommended
- **Make**: Usually pre-installed on macOS/Linux
- **Node.js**: Version 18+ (only needed for local development without Docker)
- **Git**: For cloning the repository

### System Requirements

- **RAM**: Minimum 2GB, recommended 4GB+
- **Disk Space**: 2GB+ for Docker images and dependencies
- **OS**: macOS, Linux, or Windows with WSL2

## Quick Start

### Option 1: Docker Development (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd greedy

# Start the development environment
make dev-fast
```

The application will be available at `http://localhost:3000`.

### Option 2: Local Development

```bash
# Clone and setup
git clone <your-repo-url>
cd greedy

# Install dependencies
make install-deps

# Start development server
make app-dev
```

## Makefile Commands

### Development Commands

#### 🚀 Application Development
```bash
make app-dev          # Start Next.js development server
make app-build        # Build for production
make app-start        # Start production server
make app-install      # Install dependencies
make app-lint         # Run linting
```

#### ⚡ Fast Docker Development
```bash
make dev-fast         # Start optimized development environment
make dev-watch        # Start with file watching/hot reload
make dev-rebuild      # Rebuild containers with optimizations
make dev-clean        # Clean and restart development environment
```

#### 🐳 Docker Compose Commands
```bash
make build            # Build all images (no-cache)
make build-dev        # Build development images
make up               # Start services (foreground)
make start            # Start services (detached)
make stop             # Stop services
make status           # Show container status
make down             # Stop and remove containers
make clean            # Remove containers, images, volumes
```

#### 🔧 Individual Service Control
```bash
make dev-up           # Start dev stack (foreground)
make dev-start        # Start dev stack (detached)
make dev-frontend     # Start only frontend
make dev-backend      # Start only backend
make rebuild-frontend # Rebuild and restart frontend
make rebuild-backend  # Rebuild and restart backend
```

#### 📊 Monitoring & Logs
```bash
make logs             # Follow container logs
make status           # Show container status
```

### Production Commands

#### 🐳 Docker Production
```bash
make app-docker-up     # Start production containers
make app-docker-start  # Start production (detached)
make app-docker-stop   # Stop production containers
make app-docker-build  # Build production image
make app-docker-logs   # View production logs
make app-docker-clean  # Clean production containers
```

### Code Quality Commands

#### 🎯 Combined Commands (All Packages)
```bash
make install-deps     # Install all dependencies
make lint             # Lint all packages
make lint-fix         # Auto-fix linting issues
make format           # Format all code
make format-check     # Check code formatting
make test             # Run all tests
make test-coverage    # Run tests with coverage
make typecheck        # Type check all packages
```

#### 🔧 Individual Package Commands

**Backend:**
```bash
make backend-dev          # Start backend dev server
make backend-build        # Build backend
make backend-test         # Run backend tests
make backend-lint         # Lint backend
make backend-format       # Format backend
```

**Frontend:**
```bash
make frontend-dev         # Start frontend dev server
make frontend-build       # Build frontend
make frontend-lint        # Lint frontend
make frontend-format      # Format frontend
```

**Shared Package:**
```bash
make shared-build         # Build shared package
make shared-lint          # Lint shared package
make shared-format        # Format shared package
```

### Database Commands

```bash
make seed-magic-items    # Seed magic items into database
```

## Docker Setup Details

### Development Environment

The development setup uses `docker-compose.dev.yml` with:

- **Hot Reload**: Source code is volume-mounted for instant updates
- **Database Persistence**: SQLite database mounted as volume
- **Development Tools**: Includes dev dependencies and debugging tools
- **Port Mapping**: Application available on `http://localhost:3000`

**Key Features:**
- Volume mounts for source code (`./adventure-diary:/app`)
- Node modules optimization to avoid container rebuilds
- Database file persistence (`./campaign.db:/app/campaign.db`)

### Production Environment

The production setup uses `docker-compose.app.yml` with:

- **Optimized Image**: Multi-stage build for minimal image size
- **Standalone Output**: Next.js standalone deployment
- **Security**: Non-root user execution
- **Restart Policy**: Automatic restart on failure

**Key Features:**
- Production-optimized Node.js Alpine image
- Database volume mounting for persistence
- Automatic restart policy

### Docker Architecture

```
adventure-diary/
├── Dockerfile          # Production multi-stage build
├── Dockerfile.dev      # Development build
├── docker-compose.dev.yml    # Development environment
├── docker-compose.app.yml    # Production environment
└── campaign.db         # SQLite database (mounted)
```

## Development Workflow

### Daily Development

1. **Start Development Environment:**
   ```bash
   make dev-fast
   ```

2. **Make Code Changes:**
   - Edit files in your IDE
   - Changes are automatically reflected (hot reload)

3. **Check Code Quality:**
   ```bash
   make lint
   make format-check
   ```

4. **Run Tests:**
   ```bash
   make test
   ```

5. **View Logs:**
   ```bash
   make logs
   ```

### Adding New Features

1. **Create Feature Branch:**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Develop with Hot Reload:**
   ```bash
   make dev-watch
   ```

3. **Test Changes:**
   ```bash
   make test
   make lint-fix
   ```

4. **Build and Verify:**
   ```bash
   make app-build
   make app-docker-build
   ```

### Database Changes

1. **Modify Schema:**
   - Edit files in `lib/db/schema.ts`
   - Update migrations in `lib/db/migrations/`

2. **Run Migrations:**
   ```bash
   make app-dev  # Migrations run automatically on startup
   ```

3. **Seed Data:**
   ```bash
   make seed-magic-items
   ```

## Production Deployment

### Docker Production Deployment

1. **Build Production Image:**
   ```bash
   make app-docker-build
   ```

2. **Start Production Containers:**
   ```bash
   make app-docker-start
   ```

3. **Verify Deployment:**
   ```bash
   make app-docker-logs
   curl http://localhost:3000
   ```

4. **Monitor Application:**
   ```bash
   make app-docker-logs -f  # Follow logs
   ```

### Environment Variables

Create a `.env.local` file for production:

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
DATABASE_URL=file:./database/campaign.db
```

### Backup Strategy

**Database Backup:**
```bash
# Stop containers before backup
make app-docker-stop

# Backup database
cp campaign.db campaign.db.backup

# Restart containers
make app-docker-start
```

## Troubleshooting

### Common Issues

#### Docker Build Failures

**Issue:** `failed to solve: Internal: write /var/lib/docker/buildkit/containerd-overlayfs/metadata_v2.db: input/output error`

**Solutions:**
1. **Restart Docker:**
   ```bash
   # macOS
   sudo killall Docker && open /Applications/Docker.app

   # Linux
   sudo systemctl restart docker
   ```

2. **Clean Docker Cache:**
   ```bash
   docker system prune -a
   make clean
   ```

3. **Use Alternative Startup:**
   ```bash
   make app-dev  # Start without Docker
   ```

#### Port Already in Use

**Issue:** `Port 3000 is already in use`

**Solutions:**
1. **Find Process:**
   ```bash
   lsof -i :3000
   ```

2. **Kill Process:**
   ```bash
   kill -9 <PID>
   ```

3. **Change Port:**
   Edit `docker-compose.dev.yml` and change port mapping

#### Database Issues

**Issue:** Database not persisting

**Solution:** Ensure database file permissions:
```bash
chmod 664 campaign.db
```

**Issue:** Database locked

**Solution:** Stop all containers and restart:
```bash
make stop
make dev-fast
```

#### Node Modules Issues

**Issue:** Dependencies not installing

**Solutions:**
1. **Clear Cache:**
   ```bash
   make dev-clean
   ```

2. **Manual Install:**
   ```bash
   cd adventure-diary
   rm -rf node_modules package-lock.json
   npm install
   ```

### Performance Issues

#### Slow Docker Builds

**Solutions:**
1. **Use Build Cache:**
   ```bash
   make dev-rebuild  # Uses parallel builds
   ```

2. **Optimize Dockerfile:**
   - Dependencies installed first for better caching
   - Multi-stage builds for production

#### Slow Development Reload

**Solutions:**
1. **Use dev-watch:**
   ```bash
   make dev-watch  # Optimized file watching
   ```

2. **Check Volume Mounts:**
   Ensure source code is properly mounted in containers

### Logs and Debugging

#### View Application Logs

```bash
# Development logs
make logs

# Production logs
make app-docker-logs

# Follow logs in real-time
make logs -f
```

#### Container Debugging

```bash
# Access running container
docker compose -f docker-compose.dev.yml exec adventure-diary sh

# View container status
make status

# Check container health
docker ps
```

#### Database Debugging

```bash
# Access database file
ls -la campaign.db

# Check database size
du -h campaign.db

# Backup before troubleshooting
cp campaign.db campaign.db.backup
```

## Advanced Configuration

### Custom Docker Configuration

#### Adding Environment Variables

Edit `docker-compose.dev.yml`:

```yaml
environment:
  - NODE_ENV=development
  - NEXT_TELEMETRY_DISABLED=1
  - CUSTOM_VAR=value
```

#### Volume Mounts

Add additional volumes in `docker-compose.dev.yml`:

```yaml
volumes:
  - ./adventure-diary:/app
  - /app/node_modules
  - ./campaign.db:/app/campaign.db
  - ./logs:/app/logs  # Additional log volume
```

### Makefile Customization

#### Adding New Commands

Edit `Makefile` and add new targets:

```makefile
# Example: Add database migration command
db-migrate:
	@echo "🔄 Running database migrations..."
	docker compose --profile dev exec adventure-diary npm run db:migrate
```

#### Environment-Specific Commands

```makefile
# Production-specific command
prod-deploy:
	@echo "🚀 Deploying to production..."
	make app-docker-build
	make app-docker-stop
	make app-docker-start
```

## Contributing

### Development Setup

1. **Fork and Clone:**
   ```bash
   git clone <your-fork-url>
   cd greedy
   ```

2. **Setup Development:**
   ```bash
   make install-deps
   make dev-fast
   ```

3. **Create Feature Branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Follow Code Standards:**
   ```bash
   make lint-fix
   make format
   make test
   ```

5. **Submit Pull Request:**
   - Ensure all tests pass
   - Update documentation if needed
   - Follow conventional commit messages

### Code Quality Gates

Before submitting PRs:
- ✅ All tests pass (`make test`)
- ✅ Code linted (`make lint`)
- ✅ Code formatted (`make format-check`)
- ✅ Type checking passes (`make typecheck`)

## Support

### Getting Help

1. **Check Logs:** `make logs`
2. **Container Status:** `make status`
3. **Common Issues:** Refer to Troubleshooting section
4. **Documentation:** Check this guide and inline code comments

### Reporting Issues

When reporting bugs, include:
- Makefile command used
- Docker version (`docker --version`)
- OS and version
- Full error output
- Steps to reproduce

### Performance Monitoring

Monitor application health:
```bash
# Check container resource usage
docker stats

# View application metrics
curl http://localhost:3000/api/health

# Database performance
sqlite3 campaign.db ".stats on" ".tables"
```

---

**Happy adventuring! 🎲⚔️**</content>
<parameter name="filePath">/Users/gianluca/Projects/github/gi4nks/greedy/DOCKER_MAKEFILE_GUIDE.md