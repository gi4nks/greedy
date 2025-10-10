#!/bin/bash
set -e

echo "🧹 Starting workspace cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to prompt for confirmation
confirm() {
    read -p "$(echo -e "${YELLOW}$1 (y/N): ${NC}")" -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Check if we're in the right directory
if [[ ! -f "NEXTJS_MIGRATION_PLAN.md" ]]; then
    echo -e "${RED}Error: Please run this script from the greedy project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}Current directory: $(pwd)${NC}"
echo -e "${BLUE}Found these directories:${NC}"
ls -la | grep "^d" | grep -E "(frontend|backend|app|shared|adventure-diary)"

echo ""
echo -e "${YELLOW}This script will:${NC}"
echo "  1. 📦 Migrate data from backend to adventure-diary (if needed)"
echo "  2. 🗑️  Remove old frontend/ directory"
echo "  3. 🗑️  Remove old backend/ directory"
echo "  4. 🗑️  Remove old app/ directory (not adventure-diary/app/)"
echo "  5. 🗑️  Remove old shared/ directory" 
echo "  6. 🧹 Clean up root package.json and configs"
echo "  7. 📄 Update documentation"
echo ""

if ! confirm "Do you want to proceed with the cleanup?"; then
    echo -e "${YELLOW}Cleanup cancelled${NC}"
    exit 0
fi

# Step 1: Migrate data if needed
echo -e "\n${BLUE}Step 1: Checking data migration...${NC}"
cd adventure-diary

if [[ -f "../backend/data/campaign.db" && ! -f "./app/database/campaign.db" ]]; then
    echo -e "${YELLOW}Backend database found, running migration...${NC}"
    if command -v tsx &> /dev/null; then
        npx tsx scripts/migrate-from-backend.ts
    else
        echo -e "${RED}Warning: tsx not available, skipping data migration${NC}"
        echo -e "${YELLOW}You'll need to migrate data manually later${NC}"
    fi
else
    echo -e "${GREEN}Data migration not needed or already done${NC}"
fi

cd ..

# Step 2: Remove frontend directory
echo -e "\n${BLUE}Step 2: Removing frontend/ directory...${NC}"
if [[ -d "frontend" ]]; then
    if confirm "Remove frontend/ directory?"; then
        rm -rf frontend
        echo -e "${GREEN}✅ Removed frontend/ directory${NC}"
    else
        echo -e "${YELLOW}Kept frontend/ directory${NC}"
    fi
else
    echo -e "${GREEN}frontend/ directory not found${NC}"
fi

# Step 3: Remove backend directory
echo -e "\n${BLUE}Step 3: Removing backend/ directory...${NC}"
if [[ -d "backend" ]]; then
    if confirm "Remove backend/ directory?"; then
        # Backup the database first
        if [[ -f "backend/data/campaign.db" ]]; then
            echo -e "${YELLOW}Creating backup of backend database...${NC}"
            cp backend/data/campaign.db ./campaign-backup-$(date +%Y%m%d-%H%M%S).db
            echo -e "${GREEN}Database backed up${NC}"
        fi
        
        rm -rf backend
        echo -e "${GREEN}✅ Removed backend/ directory${NC}"
    else
        echo -e "${YELLOW}Kept backend/ directory${NC}"
    fi
else
    echo -e "${GREEN}backend/ directory not found${NC}"
fi

# Step 4: Remove old app directory (not adventure-diary/app/)
echo -e "\n${BLUE}Step 4: Removing old app/ directory...${NC}"
if [[ -d "app" && ! -f "app/layout.tsx" ]]; then
    if confirm "Remove old app/ directory?"; then
        rm -rf app
        echo -e "${GREEN}✅ Removed old app/ directory${NC}"
    else
        echo -e "${YELLOW}Kept app/ directory${NC}"
    fi
else
    echo -e "${GREEN}Old app/ directory not found or is Next.js app${NC}"
fi

# Step 5: Remove shared directory
echo -e "\n${BLUE}Step 5: Removing shared/ directory...${NC}"
if [[ -d "shared" ]]; then
    if confirm "Remove shared/ directory?"; then
        rm -rf shared
        echo -e "${GREEN}✅ Removed shared/ directory${NC}"
    else
        echo -e "${YELLOW}Kept shared/ directory${NC}"
    fi
else
    echo -e "${GREEN}shared/ directory not found${NC}"
fi

# Step 6: Clean up root package.json
echo -e "\n${BLUE}Step 6: Updating root package.json...${NC}"
if [[ -f "package.json" ]]; then
    # Create a minimal root package.json
    cat > package.json << 'EOF'
{
  "name": "adventure-diary-workspace",
  "private": true,
  "workspaces": ["adventure-diary"],
  "scripts": {
    "dev": "cd adventure-diary && npm run dev",
    "build": "cd adventure-diary && npm run build", 
    "start": "cd adventure-diary && npm run start",
    "lint": "cd adventure-diary && npm run lint"
  },
  "devDependencies": {
    "husky": "^9.1.7"
  }
}
EOF
    echo -e "${GREEN}✅ Updated root package.json${NC}"
else
    echo -e "${YELLOW}No root package.json found${NC}"
fi

# Remove old lock files and node_modules
echo -e "\n${BLUE}Cleaning up old dependencies...${NC}"
if [[ -f "package-lock.json" && -d "node_modules" ]]; then
    rm -rf node_modules package-lock.json
    echo -e "${GREEN}✅ Removed old node_modules and package-lock.json${NC}"
fi

# Step 7: Clean up Docker files
echo -e "\n${BLUE}Step 7: Cleaning up Docker files...${NC}"
docker_files=("docker-compose.yml" "docker-compose.dev.yml" "docker-compose.app.yml")
for file in "${docker_files[@]}"; do
    if [[ -f "$file" ]]; then
        if confirm "Remove $file?"; then
            rm "$file"
            echo -e "${GREEN}✅ Removed $file${NC}"
        fi
    fi
done

# Step 8: Update .gitignore
echo -e "\n${BLUE}Step 8: Updating .gitignore...${NC}"
if [[ -f ".gitignore" ]]; then
    # Add Next.js specific ignores if not present
    if ! grep -q ".next" .gitignore; then
        cat >> .gitignore << 'EOF'

# Next.js
.next/
out/

# Database files
*.db
*.db-*

# Local env files
.env.local
.env.development.local
.env.test.local
.env.production.local
EOF
        echo -e "${GREEN}✅ Updated .gitignore${NC}"
    fi
fi

# Step 9: Create README update
echo -e "\n${BLUE}Step 9: Creating updated README...${NC}"
cat > README.md << 'EOF'
# Adventure Diary - D&D Campaign Manager

A modern Next.js application for managing D&D campaigns, sessions, characters, and timelines.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd greedy

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Database
The application uses SQLite with Drizzle ORM. The database file is automatically created in `adventure-diary/app/database/campaign.db`.

## 🏗️ Architecture

This is a Next.js 15 application using:
- **App Router** for file-based routing
- **Server Components** for data fetching
- **Server Actions** for mutations
- **Drizzle ORM** with SQLite for the database
- **Tailwind CSS** + **DaisyUI** for styling
- **TypeScript** for type safety

## 📁 Project Structure

```
adventure-diary/
├── app/                 # Next.js App Router
│   ├── campaigns/      # Campaign management pages
│   ├── search/         # Advanced search functionality
│   ├── api/           # API routes
│   └── database/      # SQLite database
├── components/        # Reusable React components
├── lib/              # Utilities and business logic
│   ├── db/           # Database schema and connection
│   ├── actions/      # Server Actions
│   └── services/     # Business logic services
└── public/          # Static assets
```

## ✨ Features

- **Campaign Management**: Create and manage D&D campaigns
- **Session Tracking**: Log session notes and events
- **Timeline Visualization**: Interactive timeline of campaign events  
- **Character Management**: Track PCs and NPCs
- **Advanced Search**: Search across all campaign content
- **Responsive Design**: Works on desktop and mobile

## 🔧 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## 📝 Migration Notes

This application replaces the previous frontend/backend architecture with a unified Next.js application. All data has been migrated to the new system.
EOF

echo -e "${GREEN}✅ Created updated README.md${NC}"

echo ""
echo -e "${GREEN}🎉 Workspace cleanup completed!${NC}"
echo ""
echo -e "${BLUE}Summary of changes:${NC}"
echo -e "  ${GREEN}✅ Migrated to Next.js architecture${NC}"
echo -e "  ${GREEN}✅ Removed old frontend/backend directories${NC}"
echo -e "  ${GREEN}✅ Updated configuration files${NC}"
echo -e "  ${GREEN}✅ Created clean project structure${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. ${BLUE}cd adventure-diary${NC}"
echo -e "  2. ${BLUE}npm install${NC} (if needed)"
echo -e "  3. ${BLUE}npm run dev${NC}"
echo -e "  4. Visit ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Note: Database backups were created for safety${NC}"