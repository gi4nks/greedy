#!/bin/bash

# Adventure Diary - Post-Migration Verification Script
# This script verifies that the Next.js migration and cleanup was successful

echo "🚀 Adventure Diary - Post-Migration Verification"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📁 Checking project structure..."

# Verify old directories are gone
if [ -d "frontend" ] || [ -d "backend" ] || [ -d "app" ] || [ -d "shared" ]; then
    echo "❌ Old directories still exist - cleanup may not be complete"
    echo "   Remaining directories:"
    [ -d "frontend" ] && echo "   - frontend/"
    [ -d "backend" ] && echo "   - backend/"
    [ -d "app" ] && echo "   - app/"
    [ -d "shared" ] && echo "   - shared/"
else
    echo "✅ Old directories successfully removed"
fi

# Verify Next.js app exists
if [ -d "adventure-diary" ]; then
    echo "✅ Next.js application directory exists"
else
    echo "❌ Next.js application directory not found"
    exit 1
fi

echo "📦 Checking Next.js application..."

cd adventure-diary

# Check key files exist
key_files=(
    "package.json"
    "next.config.js" 
    "tailwind.config.js"
    "app/layout.tsx"
    "app/page.tsx"
    "lib/db/schema.ts"
    "components/Navigation.tsx"
)

for file in "${key_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Check key pages exist
pages=(
    "app/campaigns/page.tsx"
    "app/adventures/page.tsx" 
    "app/characters/page.tsx"
    "app/sessions/page.tsx"
    "app/search/page.tsx"
    "app/analytics/page.tsx"
)

echo "📄 Checking application pages..."
for page in "${pages[@]}"; do
    if [ -f "$page" ]; then
        echo "✅ $page exists"
    else
        echo "❌ $page missing"
    fi
done

# Check database directory
if [ -d "database" ]; then
    echo "✅ Database directory exists"
else
    echo "❌ Database directory not found"
fi

echo "🔍 Checking dependencies..."

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Dependencies not installed - run 'npm install'"
fi

echo "================================================"
echo "✅ Migration verification complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Run 'npm run dev' to start the development server"
echo "   2. Open http://localhost:3000 in your browser"
echo "   3. Create your first campaign to test functionality"
echo ""
echo "📚 Available pages:"
echo "   • Home: /"
echo "   • Campaigns: /campaigns"  
echo "   • Adventures: /adventures"
echo "   • Characters: /characters"
echo "   • Sessions: /sessions"
echo "   • Search: /search"
echo "   • Analytics: /analytics"