#!/bin/bash
# scripts/dev-workflow.sh - Development workflow demonstration

echo "🔧 Greedy Development Workflow"
echo "=============================="
echo ""
echo "This script demonstrates the improved development workflow."
echo "You can now rebuild individual services without stopping everything!"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "📋 Available development commands:"
echo ""
echo "  🚀 Start development with hot reload:"
echo "     make dev-up"
echo ""
echo "  🔄 Rebuild individual services:"
echo "     make rebuild-frontend    # Only rebuild frontend"
echo "     make rebuild-backend     # Only rebuild backend"
echo ""
echo "  🎯 Start individual services:"
echo "     make dev-frontend        # Only start frontend"
echo "     make dev-backend         # Only start backend"
echo ""
echo "  📊 Monitor development:"
echo "     make dev-logs            # View development logs"
echo "     make dev-down            # Stop development containers"
echo ""
echo "  📖 Other useful commands:"
echo "     make help                # Show all available commands"
echo "     make logs                # View production logs"
echo ""

echo "💡 Workflow examples:"
echo ""
echo "1. Start development environment:"
echo "   make dev-up"
echo ""
echo "2. Make changes to frontend code"
echo ""
echo "3. Rebuild only frontend:"
echo "   make rebuild-frontend"
echo ""
echo "4. Changes are immediately available at http://localhost:3000"
echo ""
echo "5. Make changes to backend code"
echo ""
echo "6. Rebuild only backend:"
echo "   make rebuild-backend"
echo ""
echo "7. API changes are immediately available at http://localhost:3001"
echo ""

echo "🎉 No more stopping and restarting the entire stack for every change!"