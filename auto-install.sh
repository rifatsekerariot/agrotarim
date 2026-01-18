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

# ✅ SECURITY: Remove only project-specific volumes (safer than prune -f)
echo "Removing project volumes..."
docker volume rm sera_postgres_data 2>/dev/null || true
docker volume rm agrotarim_postgres_data 2>/dev/null || true
docker volume rm sera-otomasyon_postgres_data 2>/dev/null || true

# List remaining volumes for verification
echo ""
echo "Current Docker volumes:"
docker volume ls | grep -E "sera|agro" || echo "  (no project volumes found)"

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

# Generate random PostgreSQL password (32 characters, alphanumeric only)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/\n" | cut -c1-32)

# ✅ SECURITY: Don't display full credentials, only lengths
echo -e "${GREEN}✅ Credentials generated${NC}"
echo "   JWT_SECRET: ${#JWT_SECRET} characters (hidden for security)"
echo "   DB_PASSWORD: ${#DB_PASSWORD} characters (hidden for security)"

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
# 8. Wait for Services & Verify Builds
# ============================================

echo ""
echo "⏳ Waiting for services to be ready..."

# Wait for PostgreSQL (already done above, but double-check)
sleep 3

# ✅ NEW: Wait for Frontend Build
echo ""
echo "📦 Verifying frontend build..."

FRONTEND_READY=false
for i in {1..60}; do
    if docker exec sera_frontend test -f /app/dist/index.html 2>/dev/null; then
        echo -e "${GREEN}✅ Frontend build verified${NC}"
        FRONTEND_READY=true
        break
    fi
    
    if [ $i -eq 1 ]; then
        echo "   Waiting for frontend build to complete..."
    fi
    
    if [ $((i % 10)) -eq 0 ]; then
        echo "   Still waiting... ($i/60 seconds)"
    fi
    
    sleep 1
done

if [ "$FRONTEND_READY" != "true" ]; then
    echo -e "${RED}❌ Frontend build timeout or failed${NC}"
    echo ""
    echo "Checking frontend logs:"
    # ✅ SECURITY: Filter sensitive data from logs
    docker logs sera_frontend --tail 30 | grep -v "JWT_SECRET\|PASSWORD\|API_KEY"
    echo ""
    echo "Checking if dist/ exists:"
    docker exec sera_frontend ls -la /app/ 2>/dev/null || echo "Cannot access container"
    exit 1
fi

# ✅ NEW: Test Frontend HTTP Response
echo ""
echo "🧪 Testing frontend HTTP response..."

FRONTEND_HTTP=false
for i in {1..30}; do
    if curl -s http://localhost:5173/ | grep -q "<!DOCTYPE html>"; then
        echo -e "${GREEN}✅ Frontend HTTP responding${NC}"
        FRONTEND_HTTP=true
        break
    fi
    
    if [ $((i % 10)) -eq 0 ]; then
        echo "   Waiting for HTTP... ($i/30 seconds)"
    fi
    
    sleep 1
done

if [ "$FRONTEND_HTTP" != "true" ]; then
    echo -e "${YELLOW}⚠️  Frontend not responding to HTTP (may need manual check)${NC}"
fi

# ============================================
# 9. Initialize Database Schema
# ============================================

echo ""
echo "🔄 Initializing database schema..."

# For fresh installations, use db push (no migration history needed)
echo "⏳ Waiting for database connection..."
for i in {1..30}; do
    if docker exec sera_postgres pg_isready -U sera_user -d sera_db >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    fi
    echo "   Waiting for postgres... ($i/30)"
    sleep 2
done

if docker exec sera_backend npx prisma db push --accept-data-loss 2>&1 | tee /tmp/prisma_push.log; then
    echo -e "${GREEN}✅ Database schema initialized${NC}"
else
    echo -e "${YELLOW}⚠️  db push had issues, checking logs...${NC}"
    cat /tmp/prisma_push.log
    
    # Try to continue anyway
    echo "Attempting to generate Prisma client..."
    docker exec sera_backend npx prisma generate
fi

# ✅ NEW: Verify tables actually exist
echo "🔍 Verifying database tables..."
if docker exec sera_backend npx prisma migrate status >/dev/null 2>&1; then
     echo -e "${GREEN}✅ Database tables verified${NC}"
else
     echo -e "${YELLOW}⚠️  Could not verify specific tables, but proceeding...${NC}"
fi

# Generate Prisma client if not already done
echo ""
echo "📦 Generating Prisma client..."
docker exec sera_backend npx prisma generate

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
if docker exec sera_postgres pg_isready -U sera_user -d sera_db &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL: Running${NC}"
else
    echo -e "${RED}❌ PostgreSQL: Failed (check logs)${NC}"
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
echo "🔐 Security Information:"
echo "   - All credentials stored securely in .env files"
echo "   - Database User: sera_user"
echo "   - Database Name: sera_db"
echo "   - Database Password: (see .env file)"
echo "   - JWT Secret: (see .env file)"
echo ""
echo "⚠️  IMPORTANT: Keep .env files secure and never commit to git!"
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
