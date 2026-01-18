#!/bin/bash

# ============================================
# 🔍 Post-Setup Verification Script
# ============================================
# Verifies that setup.sh completed successfully
# and application is ready to run
# ============================================

set -e

echo "============================================"
echo "🔍 Post-Setup Verification"
echo "============================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# ============================================
# 1. Backend Checks
# ============================================

echo "📦 Checking Backend..."

# node_modules
if [ ! -d "backend/node_modules" ]; then
    echo -e "${RED}❌ backend/node_modules not found${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
fi

# .env file
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env not found${NC}"
    echo "   Run: ./setup-env.sh"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ backend/.env exists${NC}"
    
    # Check JWT_SECRET
    if grep -q "^JWT_SECRET=" backend/.env; then
        JWT_LEN=$(grep "^JWT_SECRET=" backend/.env | cut -d'=' -f2 | wc -c)
        if [ "$JWT_LEN" -lt 32 ]; then
            echo -e "${YELLOW}⚠️  JWT_SECRET too short ($JWT_LEN chars)${NC}"
        else
            echo -e "${GREEN}✅ JWT_SECRET configured (${JWT_LEN} chars)${NC}"
        fi
    else
        echo -e "${RED}❌ JWT_SECRET not set in .env${NC}"
        ERRORS=$((ERRORS+1))
    fi
    
    # Check DATABASE_URL
    if grep -q "^DATABASE_URL=" backend/.env; then
        echo -e "${GREEN}✅ DATABASE_URL configured${NC}"
    else
        echo -e "${YELLOW}⚠️  DATABASE_URL not set (might use default)${NC}"
    fi
fi

# Prisma client
if [ -d "backend/node_modules/.prisma" ]; then
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma client not generated (run: npx prisma generate)${NC}"
fi

echo ""

# ============================================
# 2. Frontend Checks
# ============================================

echo "🎨 Checking Frontend..."

# node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${RED}❌ frontend/node_modules not found${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
fi

# Build output (optional)
if [ -d "frontend/dist" ]; then
    echo -e "${GREEN}✅ Frontend build exists${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend not built (run: npm run build in frontend/)${NC}"
fi

# Vite config check
if grep -q "target: 'http://localhost:3009'" frontend/vite.config.js; then
    echo -e "${GREEN}✅ Vite proxy configured correctly (port 3009)${NC}"
else
    echo -e "${RED}❌ Vite proxy misconfigured (should target port 3009)${NC}"
    ERRORS=$((ERRORS+1))
fi

echo ""

# ============================================
# 3. Port Availability
# ============================================

echo "🔌 Checking Port Availability..."

# Backend port (3009)
if lsof -Pi :3009 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 3009 already in use (backend might be running)${NC}"
else
    echo -e "${GREEN}✅ Port 3009 available${NC}"
fi

# Frontend dev port (5173)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 5173 already in use (frontend might be running)${NC}"
else
    echo -e "${GREEN}✅ Port 5173 available${NC}"
fi

# Frontend prod port (3008)
if lsof -Pi :3008 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 3008 already in use${NC}"
else
    echo -e "${GREEN}✅ Port 3008 available${NC}"
fi

echo ""

# ============================================
# 4. Database Connection (Optional)
# ============================================

echo "🗄️  Checking Database Connection..."

if [ -f "backend/.env" ] && grep -q "^DATABASE_URL=" backend/.env; then
    cd backend
    if npx prisma db execute --stdin <<< "SELECT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        echo "   Check DATABASE_URL in backend/.env"
        echo "   Ensure PostgreSQL is running"
        ERRORS=$((ERRORS+1))
    fi
    cd ..
else
    echo -e "${YELLOW}⚠️  Skipping (DATABASE_URL not set)${NC}"
fi

echo ""

# ============================================
# 5. Critical Files Check
# ============================================

echo "📄 Checking Critical Files..."

CRITICAL_FILES=(
    "backend/src/index.js"
    "backend/prisma/schema.prisma"
    "frontend/src/main.jsx"
    "frontend/src/App.jsx"
    "frontend/index.html"
    "docker-compose.yml"
    "README.md"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        ERRORS=$((ERRORS+1))
    fi
done

echo ""

# ============================================
# Summary
# ============================================

echo "============================================"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All Checks Passed!${NC}"
    echo "============================================"
    echo ""
    echo "🚀 Ready to start application:"
    echo ""
    echo "Development:"
    echo "  Terminal 1: cd backend && npm start"
    echo "  Terminal 2: cd frontend && npm run dev"
    echo "  Access: http://localhost:5173"
    echo ""
    echo "Production (Docker):"
    echo "  docker compose up -d --build"
    echo "  Access: http://localhost:3008"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $ERRORS Error(s) Found!${NC}"
    echo "============================================"
    echo ""
    echo "Please fix the errors above and run:"
    echo "  ./setup.sh"
    echo ""
    exit 1
fi
