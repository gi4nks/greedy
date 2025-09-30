#!/bin/bash
# scripts/docker-stop.sh - Easy shutdown script

echo "🛑 Stopping Greedy Application"
echo "============================="

# Stop and remove containers
docker compose --profile dev down

echo "✅ Application stopped successfully!"
echo ""
echo "💡 To remove all data (including database):"
echo "   docker compose down -v"
echo ""
echo "🔧 To remove images:"
echo "   docker compose down --rmi all"