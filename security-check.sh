#!/bin/bash

# ============================================
# 🔒 Production Security Checklist
# ============================================
# Run this after installation to verify security
# ============================================

echo "============================================"
echo "🔒 Production Security Verification"
echo "============================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ISSUES=0

# 1. Check .env files are not in git
echo "📋 1. Checking .env files..."
if git ls-files | grep -q "^\.env$\|^backend/\.env$"; then
    echo -e "${RED}❌ .env files are tracked by git!${NC}"
    ISSUES=$((ISSUES+1))
else
    echo -e "${GREEN}✅ .env files not in git${NC}"
fi

# 2. Check JWT_SECRET strength
echo ""
echo "🔐 2. Checking JWT_SECRET..."
if [ -f ".env" ]; then
    JWT_LEN=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2 | wc -c)
    if [ "$JWT_LEN" -lt 64 ]; then
        echo -e "${RED}❌ JWT_SECRET too short: $JWT_LEN chars (min 64)${NC}"
        ISSUES=$((ISSUES+1))
    else
        echo -e "${GREEN}✅ JWT_SECRET strong: $JWT_LEN chars${NC}"
    fi
fi

# 3. Check PostgreSQL auth method
echo ""
echo "🗄️  3. Checking PostgreSQL auth..."
if docker exec sera_postgres cat /var/lib/postgresql/data/pg_hba.conf 2>/dev/null | grep -q "scram-sha-256"; then
    echo -e "${GREEN}✅ Using SCRAM-SHA-256 (production-grade)${NC}"
else
    echo -e "${YELLOW}⚠️  Not using SCRAM-SHA-256${NC}"
fi

# 4. Check HTTPS (if in production)
echo ""
echo "🌐 4. Checking HTTPS..."
if [ "$NODE_ENV" == "production" ]; then
    echo -e "${YELLOW}⚠️  Remember to configure HTTPS/TLS (Nginx + Let's Encrypt)${NC}"
else
    echo -e "${GREEN}✅ Development mode${NC}"
fi

# 5. Check rate limiting
echo ""
echo "🚦 5. Checking rate limiting..."
if grep -q "express-rate-limit" backend/package.json; then
    echo -e "${GREEN}✅ Rate limiting installed${NC}"
else
    echo -e "${RED}❌ Rate limiting not found${NC}"
    ISSUES=$((ISSUES+1))
fi

# 6. Check Docker volumes
echo ""
echo "💾 6. Checking Docker volumes..."
VOLUME_COUNT=$(docker volume ls | grep -E "sera|agro" | wc -l)
echo "   Project volumes: $VOLUME_COUNT"
if [ "$VOLUME_COUNT" -eq 1 ]; then
    echo -e "${GREEN}✅ Clean volume state${NC}"
else
    echo -e "${YELLOW}⚠️  Multiple volumes detected (old installations?)${NC}"
fi

# 7. Check firewall (basic)
echo ""
echo "🔥 7. Checking exposed ports..."
EXPOSED=$(docker ps --format "{{.Ports}}" | grep -o "0.0.0.0:[0-9]*" | sort -u)
echo "   Exposed ports:"
echo "$EXPOSED" | while read port; do
    echo "      - $port"
done
echo -e "${YELLOW}⚠️  Ensure firewall only allows: 80, 443, SSH${NC}"

# 8. Check default passwords
echo ""
echo "🔑 8. Checking for default/weak passwords..."
if grep -q "12345\|admin\|password" backend/.env 2>/dev/null; then
    echo -e "${RED}❌ Weak/default password found!${NC}"
    ISSUES=$((ISSUES+1))
else
    echo -e "${GREEN}✅ No obvious weak passwords${NC}"
fi

# Summary
echo ""
echo "============================================"
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Security Check Passed!${NC}"
    echo "============================================"
    exit 0
else
    echo -e "${RED}❌ Found $ISSUES Security Issue(s)${NC}"
    echo "============================================"
    echo ""
    echo "Please fix the issues above before deploying to production."
    exit 1
fi
