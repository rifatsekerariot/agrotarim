#!/bin/bash

# AGROMETA Installation Script
# Run this after git clone to set up the project

set -e  # Exit on error

echo "🌱 AGROMETA Installation Starting..."
echo "======================================"

# Prerequisites check
echo "📦 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/engine/install/"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Ensure bcrypt is in package.json
echo ""
echo "📝 Checking backend dependencies..."
if ! grep -q '"bcrypt"' backend/package.json; then
    echo "⚠️  Adding bcrypt to package.json..."
    # Add bcrypt to dependencies
    sed -i '/"dependencies": {/a \    "bcrypt": "^5.1.1",' backend/package.json
    echo "✅ bcrypt added"
else
    echo "✅ bcrypt already present"
fi

# Stop any running containers
echo ""
echo "🛑 Stopping existing containers..."
docker compose down || true

# Build containers
echo ""
echo "🏗️  Building Docker containers (this may take a few minutes)..."
docker compose build --no-cache

# Start services
echo ""
echo "🚀 Starting services..."
docker compose up -d

# Wait for database to be ready
echo ""
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo ""
echo "🔄 Running database migrations..."
docker compose exec -T backend npx prisma migrate deploy || {
    echo "⚠️  Migration failed, trying to generate Prisma client..."
    docker compose exec -T backend npx prisma generate
    docker compose exec -T backend npx prisma migrate deploy
}

# Restart backend to ensure changes are loaded
echo ""
echo "♻️  Restarting backend..."
docker compose restart backend

# Wait for backend to be ready
sleep 5

# Test if backend is responding
echo ""
echo "🧪 Testing backend..."
if curl -s http://localhost:3000/ > /dev/null; then
    echo "✅ Backend is running"
else
    echo "⚠️  Backend may not be ready yet, checking logs..."
    docker compose logs backend | tail -20
fi

# Final status
echo ""
echo "======================================"
echo "🎉 Installation Complete!"
echo "======================================"
echo ""
echo "📌 Next Steps:"
echo "   1. Open your browser: http://localhost:5173"
echo "   2. You should see the Setup Wizard (first time only)"
echo "   3. Create your admin account and farm"
echo ""
echo "📊 Useful Commands:"
echo "   - View logs:    docker compose logs -f"
echo "   - Stop:         docker compose down"
echo "   - Restart:      docker compose restart"
echo "   - Rebuild:      docker compose up -d --build"
echo ""
echo "🔧 Troubleshooting:"
echo "   - If Setup page doesn't appear, run: docker compose restart"
echo "   - Check backend logs: docker logs agrometa_backend"
echo "   - Check database: docker exec -it agrometa_db psql -U postgres -d agrometa"
echo ""
