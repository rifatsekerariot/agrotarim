#!/bin/bash

# ============================================
# 🔍 PostgreSQL Debug & Fix Script
# ============================================
# Run this on the server to diagnose the issue
# ============================================

echo "============================================"
echo "🔍 PostgreSQL Authentication Debug"
echo "============================================"
echo ""

# 1. Check .env files
echo "📝 1. Checking .env files..."
echo ""

if [ -f ".env" ]; then
    echo "✅ Root .env exists"
    echo "Contents:"
    cat .env | grep -v "JWT_SECRET"
else
    echo "❌ Root .env MISSING!"
fi

echo ""

if [ -f "backend/.env" ]; then
    echo "✅ backend/.env exists"
    echo "DATABASE_URL:"
    cat backend/.env | grep "DATABASE_URL"
else
    echo "❌ backend/.env MISSING!"
fi

echo ""
echo "============================================"

# 2. Check Docker containers
echo "📦 2. Checking Docker containers..."
echo ""

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "============================================"

# 3. Check PostgreSQL environment
echo "🗄️  3. Checking PostgreSQL container environment..."
echo ""

docker exec sera_postgres env | grep POSTGRES

echo ""
echo "============================================"

# 4. Test PostgreSQL connection
echo "🧪 4. Testing PostgreSQL connection..."
echo ""

# Get credentials from .env
if [ -f ".env" ]; then
    DB_USER=$(grep "^POSTGRES_USER=" .env | cut -d'=' -f2)
    DB_PASS=$(grep "^POSTGRES_PASSWORD=" .env | cut -d'=' -f2)
    DB_NAME=$(grep "^POSTGRES_DB=" .env | cut -d'=' -f2)
    
    echo "Trying to connect with:"
    echo "  User: $DB_USER"
    echo "  DB: $DB_NAME"
    echo ""
    
    # Try connection
    if docker exec sera_postgres psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        echo "✅ Connection SUCCESSFUL!"
    else
        echo "❌ Connection FAILED!"
        echo ""
        echo "Trying default postgres user..."
        if docker exec sera_postgres psql -U postgres -c "\du" 2>&1; then
            echo ""
            echo "^^^ Check if sera_user exists in the list above"
        fi
    fi
fi

echo ""
echo "============================================"

# 5. Check Docker volumes
echo "💾 5. Checking Docker volumes..."
echo ""

docker volume ls | grep postgres

echo ""
echo "Volume details:"
docker volume inspect $(docker volume ls -q | grep postgres) 2>/dev/null || echo "No postgres volumes found"

echo ""
echo "============================================"

# 6. Solution suggestions
echo "🔧 6. Suggested Solutions:"
echo ""

echo "OPTION 1: Nuclear option (destroys all data)"
echo "  sudo docker compose down -v"
echo "  sudo docker volume prune -f"
echo "  sudo ./auto-install.sh"
echo ""

echo "OPTION 2: Manual fix"
echo "  # Get into PostgreSQL container as postgres user"
echo "  docker exec -it sera_postgres psql -U postgres"
echo "  # Then run:"
echo "  DROP DATABASE IF EXISTS sera_db;"
echo "  DROP USER IF EXISTS sera_user;"
echo "  CREATE USER sera_user WITH PASSWORD 'sera_password';"
echo "  CREATE DATABASE sera_db OWNER sera_user;"
echo "  \q"
echo ""

echo "OPTION 3: Check if old container using old password"
echo "  # Check backend logs for actual DATABASE_URL being used"
echo "  docker logs sera_backend 2>&1 | grep -i database"
echo ""

echo "============================================"
echo "Run one of the options above to fix the issue"
echo "============================================"
