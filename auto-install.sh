#!/bin/bash

# ============================================
# 🚀 SERA OTOMASYON - Fully Automated Setup
# ============================================
# Zero-touch installation script
# No user input required
# ============================================

set -e

echo "============================================"
echo "🌱 Sera Otomasyon - Otomatik Kurulum"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ============================================
# 1. Prerequisites Check
# ============================================

echo "📦 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Install: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose installed${NC}"

# ============================================
# 2. Stop and Clean Old Containers
# ============================================

echo ""
echo "🧹 Cleaning old containers and volumes..."

# Stop everything
docker compose down -v 2>/dev/null || true

# Remove specific containers if they exist
docker rm -f sera_backend sera_frontend sera_postgres 2>/dev/null || true

# Remove specific volumes - FORCE CLEAN
docker volume rm agrotarim_postgres_data 2>/dev/null || true
docker volume rm sera-otomasyon_postgres_data 2>/dev/null || true

# Prune all unused volumes (be careful!)
echo "⚠️  Pruning all unused Docker volumes..."
docker volume prune -f

# List remaining volumes
echo ""
echo "Remaining volumes:"
docker volume ls

echo -e "${GREEN}✅ Cleanup complete${NC}"

# ============================================
# 3. Generate Secure Credentials
# ============================================

echo ""
echo "🔐 Generating secure credentials..."

# Generate JWT_SECRET (128 characters)
if command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -hex 64)
elif command -v node &> /dev/null; then
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
else
    echo -e "${RED}❌ Cannot generate JWT_SECRET (openssl or node required)${NC}"
    exit 1
fi

# Generate random PostgreSQL password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-24)

echo -e "${GREEN}✅ Credentials generated${NC}"
echo "   JWT_SECRET: ${#JWT_SECRET} characters"
echo "   DB_PASSWORD: ${#DB_PASSWORD} characters"

# ============================================
# 4. Create Root .env
# ============================================

echo ""
echo "📝 Creating root .env file..."

cat > .env << EOF
# ============================================
# Docker Compose Environment Variables
# Auto-generated: $(date)
# ============================================

# Security - JWT Token Secret
JWT_SECRET=$JWT_SECRET

# Database Credentials
POSTGRES_USER=sera_user
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=sera_db

# Application Environment
NODE_ENV=production
EOF

echo -e "${GREEN}✅ Root .env created${NC}"

# ============================================
# 5. Create Backend .env
# ============================================

echo ""
echo "📝 Creating backend/.env file..."

cat > backend/.env << EOF
# ============================================
# Backend Environment Variables
# Auto-generated: $(date)
# ============================================

# Security
JWT_SECRET=$JWT_SECRET
NODE_ENV=production

# Database (Docker Internal)
DATABASE_URL="postgresql://sera_user:$DB_PASSWORD@postgres:5432/sera_db?schema=public"

# Server
PORT=3009

# SMTP (Email Notifications - Configure Later)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# SMS (SMS Notifications - Configure Later)
SMS_API_KEY=
SMS_API_URL=
EOF

echo -e "${GREEN}✅ backend/.env created${NC}"

# ============================================
# 6. Verify Configuration
# ============================================

echo ""
echo "🔍 Verifying configuration..."

# Check root .env
if ! grep -q "^JWT_SECRET=" .env; then
    echo -e "${RED}❌ JWT_SECRET missing in root .env${NC}"
    exit 1
fi

if ! grep -q "^POSTGRES_PASSWORD=" .env; then
    echo -e "${RED}❌ POSTGRES_PASSWORD missing in root .env${NC}"
    exit 1
fi

# Check backend .env
if ! grep -q "^JWT_SECRET=" backend/.env; then
    echo -e "${RED}❌ JWT_SECRET missing in backend/.env${NC}"
    exit 1
fi

if ! grep -q "^DATABASE_URL=" backend/.env; then
    echo -e "${RED}❌ DATABASE_URL missing in backend/.env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuration verified${NC}"

# ============================================
# 7. Build and Start Docker Containers
# ============================================

echo ""
echo "🏗️  Building Docker images (this may take 5-10 minutes)..."

docker compose build --no-cache

echo ""
echo "🚀 Starting services..."

docker compose up -d

# ============================================
# 8. Wait for Services
# ============================================

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."

# Wait up to 30 seconds for PostgreSQL
for i in {1..30}; do
    if docker exec sera_postgres pg_isready -U sera_user &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        break
    fi
    echo "   Attempt $i/30..."
    sleep 1
done

# Verify PostgreSQL is running
if ! docker exec sera_postgres pg_isready -U sera_user &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    echo "Check logs: docker logs sera_postgres"
    exit 1
fi

sleep 3

# ============================================
# 9. Run Database Migrations
# ============================================

echo ""
echo "🔄 Running database migrations..."

docker exec sera_backend npx prisma migrate deploy || {
    echo -e "${YELLOW}⚠️  Migration failed, trying alternative approach...${NC}"
    docker exec sera_backend npx prisma db push --accept-data-loss
}

echo -e "${GREEN}✅ Database initialized${NC}"

# ============================================
# 10. Restart Backend
# ============================================

echo ""
echo "♻️  Restarting backend to apply changes..."

docker restart sera_backend
sleep 5

# ============================================
# 11. Health Check
# ============================================

echo ""
echo "🧪 Running health checks..."

# Check PostgreSQL
if docker exec sera_postgres pg_isready -U sera_user &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL: Running${NC}"
else
    echo -e "${RED}❌ PostgreSQL: Failed${NC}"
fi

# Check Backend
if curl -s http://localhost:3009/ &> /dev/null; then
    echo -e "${GREEN}✅ Backend API: Running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend API: Starting (may need a moment)${NC}"
fi

# Check Frontend
if curl -s http://localhost:5173/ &> /dev/null; then
    echo -e "${GREEN}✅ Frontend: Running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend: Starting (may need a moment)${NC}"
fi

# ============================================
# 12. Final Status
# ============================================

echo ""
echo "============================================"
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo "============================================"
echo ""
echo "📋 Access Information:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend API: http://localhost:3009"
echo ""
echo "🔐 Generated Credentials:"
echo "   - Database User: sera_user"
echo "   - Database Password: $DB_PASSWORD"
echo "   - Database Name: sera_db"
echo ""
echo "📝 Configuration Files:"
echo "   - Root .env: $(pwd)/.env"
echo "   - Backend .env: $(pwd)/backend/.env"
echo ""
echo "🎯 Next Steps:"
echo "   1. Open your browser: http://localhost:5173"
echo "   2. Complete initial setup wizard"
echo "   3. Create your admin account"
echo ""
echo "📊 Useful Commands:"
echo "   - View logs:    docker compose logs -f"
echo "   - Stop:         docker compose down"
echo "   - Restart:      docker compose restart"
echo "   - Status:       docker compose ps"
echo ""
echo "🔧 Troubleshooting:"
if [ -f ".env" ]; then
    echo "   - Root .env exists: ✅"
else
    echo "   - Root .env exists: ❌"
fi

if [ -f "backend/.env" ]; then
    echo "   - Backend .env exists: ✅"
else
    echo "   - Backend .env exists: ❌"
fi

echo ""
echo "📚 Documentation:"
echo "   - README: $(pwd)/README.md"
echo "   - Docker Guide: $(pwd)/DOCKER_GUIDE.md"
echo ""
echo -e "${GREEN}🌱 Happy farming!${NC}"
echo ""
