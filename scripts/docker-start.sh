#!/bin/bash
# scripts/docker-start.sh - Easy startup script

echo "🚀 Starting Ricky Application with Docker"
echo "==========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    exit 1
fi

echo "📦 Building and starting containers..."
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are healthy
echo "🔍 Checking service health..."

# Check that compose services are running
if docker-compose ps --services --filter "status=running" | grep -q backend; then
    echo "✅ Backend container is running"
else
    echo "❌ Backend container is not running"
fi

# Check that the SQLite DB file exists inside the backend container
if docker-compose exec -T backend test -f /app/data/campaign.db > /dev/null 2>&1; then
    echo "✅ Database file exists"
else
    echo "❌ Database file not found at /app/data/campaign.db (it will be created on first run)"
fi

# Check backend API by calling a lightweight endpoint
if curl -f http://localhost:3001/api/export > /dev/null 2>&1; then
    echo "✅ Backend API is ready"
else
    echo "❌ Backend API is not ready"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is ready"
else
    echo "❌ Frontend is not ready"
fi

echo ""
echo "🎉 Ricky Application is running!"
echo "================================="
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:3001"
echo ""
echo "🛑 To stop: docker-compose down"
echo "📊 To view logs: docker-compose logs -f"