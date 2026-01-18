#!/bin/bash

# ============================================
# 🚀 Sera Otomasyon - Production Setup Script
# ============================================
# One-command setup for production deployment
# ============================================

set -e  # Exit on error

echo "============================================"
echo "🌱 Sera Otomasyon Setup"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: Running as root is not recommended${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ============================================
# 1. Prerequisites Check
# ============================================

echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Install from: https://nodejs.org/ (version 18.x or higher)"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18.x or higher (current: $(node -v))${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# Check PostgreSQL (optional warning)
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL client not found (database must be accessible)${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL client installed${NC}"
fi

# Check Docker (optional)
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker $(docker --version | cut -d' ' -f3)${NC}"
else
    echo -e "${YELLOW}⚠️  Docker not found (manual deployment required)${NC}"
fi

echo ""

# ============================================
# 2. Environment Setup
# ============================================

echo "🔐 Setting up environment variables..."

# Run env setup script
if [ -f "./setup-env.sh" ]; then
    chmod +x ./setup-env.sh
    ./setup-env.sh
else
    echo -e "${YELLOW}⚠️  setup-env.sh not found, skipping automatic JWT generation${NC}"
    echo "Please manually create backend/.env file"
fi

# Check if .env was created
if [ ! -f "./backend/.env" ]; then
    echo -e "${RED}❌ backend/.env file was not created${NC}"
    echo "Create it manually or run: ./setup-env.sh"
    exit 1
fi

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# ============================================
# 3. Backend Setup
# ============================================

echo "📦 Installing backend dependencies..."
cd backend

# Install dependencies
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend npm install failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend dependencies installed${NC}"

# Database migration
echo "🗄️  Running database migrations..."

# Check if DATABASE_URL is set
if ! grep -q "^DATABASE_URL=" .env; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not found in .env${NC}"
    echo "Please add: DATABASE_URL=\"postgresql://user:password@localhost:5432/sera_db\""
    read -p "Continue without migration? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    # Try to run migration
    npx prisma migrate deploy 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Database migration failed (might need manual setup)${NC}"
        echo "Run manually: cd backend && npx prisma migrate deploy"
    }
    
    # Generate Prisma client
    npx prisma generate
    echo -e "${GREEN}✅ Prisma client generated${NC}"
fi

cd ..
echo ""

# ============================================
# 4. Frontend Setup
# ============================================

echo "🎨 Installing frontend dependencies..."
cd frontend

npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend npm install failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

# Build frontend for production
echo "🏗️  Building frontend for production..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Frontend build failed, but continuing...${NC}"
else
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
fi

cd ..
echo ""

# ============================================
# 6. Run Verification
# ============================================

echo "🔍 Running post-setup verification..."
chmod +x verify-setup.sh
./verify-setup.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================"
    echo -e "${GREEN}✅ Setup Complete and Verified!${NC}"
    echo "============================================"
else
    echo ""
    echo -e "${YELLOW}⚠️  Setup completed but verification found issues${NC}"
    echo "Review the output above and fix any errors"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Review your configuration:"
echo "   cat backend/.env"
echo ""
echo "2. Start the application:"
echo ""
echo "   Option A - Development:"
echo "   ------------------------"
echo "   # Terminal 1 (Backend)"
echo "   cd backend && npm start"
echo ""
echo "   # Terminal 2 (Frontend)"
echo "   cd frontend && npm run dev"
echo ""
echo "   Option B - Production (Docker):"
echo "   --------------------------------"
echo "   docker compose up -d --build"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:5173 (dev) or http://localhost:3008 (prod)"
echo "   - Backend API: http://localhost:3009"
echo ""
echo "4. Default credentials (initial setup):"
echo "   Will be created on first access to /setup page"
echo ""
echo "============================================"
echo "📚 Documentation"
echo "============================================"
echo ""
echo "- README: ./README.md"
echo "- API Docs: ./docs/API.md"
echo "- Deployment: ./DEPLOYMENT.md"
echo "- Security: ./docs/SECURITY.md"
echo ""
echo -e "${GREEN}Happy farming! 🌱${NC}"
echo ""
