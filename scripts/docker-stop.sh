#!/bin/bash
# scripts/docker-stop.sh - Easy shutdown script

echo "🛑 Stopping Ricky Application"
echo "============================="

# Stop and remove containers
docker-compose down

echo "✅ Application stopped successfully!"
echo ""
echo "💡 To remove all data (including database):"
echo "   docker-compose down -v"
echo ""
echo "🔧 To remove images:"
echo "   docker-compose down --rmi all"